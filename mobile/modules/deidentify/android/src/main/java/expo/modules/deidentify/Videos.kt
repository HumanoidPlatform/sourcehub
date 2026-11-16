package expo.modules.deidentify

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.Rect
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.annotation.OptIn
import androidx.media3.common.Effect
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.audio.AudioProcessor
import androidx.media3.common.util.UnstableApi
import androidx.media3.effect.CanvasOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.Presentation
import androidx.media3.effect.TextureOverlay
import androidx.media3.transformer.Composition
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.ProgressHolder
import androidx.media3.transformer.Transformer
import com.google.android.gms.tasks.Tasks
import com.google.common.collect.ImmutableList
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/** A frame is looked at no wider than this: enough for faces at clip
 *  resolution, and what the text reader is handed too. */
private const val LOOK_SIDE = 1280
private const val READ_SIDE = 1920
private const val ML_TIMEOUT_S = 10L

class Clip(val path: String) {
  val durationMs: Long
  val storedW: Int
  val storedH: Int
  val rotation: Int
  val hdr: Boolean

  init {
    val r = MediaMetadataRetriever()
    try {
      r.setDataSource(path)
      durationMs = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
      storedW = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toIntOrNull() ?: 0
      storedH = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toIntOrNull() ?: 0
      rotation = r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
    } finally {
      r.release()
    }
    if (durationMs <= 0 || storedW <= 0 || storedH <= 0) throw IllegalStateException("the clip cannot be read")
    hdr = isHdr(path)
  }

  val uprightW: Int get() = if (rotation % 180 != 0) storedH else storedW
  val uprightH: Int get() = if (rotation % 180 != 0) storedW else storedH

  private fun isHdr(path: String): Boolean {
    val ex = MediaExtractor()
    try {
      ex.setDataSource(path)
      for (i in 0 until ex.trackCount) {
        val f = ex.getTrackFormat(i)
        val mime = f.getString(MediaFormat.KEY_MIME) ?: continue
        if (!mime.startsWith("video/")) continue
        if (mime == MimeTypes.VIDEO_DOLBY_VISION) return true
        if (f.containsKey(MediaFormat.KEY_COLOR_TRANSFER)) {
          val t = f.getInteger(MediaFormat.KEY_COLOR_TRANSFER)
          if (t == MediaFormat.COLOR_TRANSFER_ST2084 || t == MediaFormat.COLOR_TRANSFER_HLG) return true
        }
      }
    } finally {
      ex.release()
    }
    return false
  }
}

object Videos {
  private val fastFaces by lazy {
    FaceDetection.getClient(
      FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
        .setMinFaceSize(0.05f)
        .build(),
    )
  }
  private val reader by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }

  /** The frame at t, upright, no wider than `side`; null when it cannot be had. */
  private fun frameAt(r: MediaMetadataRetriever, clip: Clip, tMs: Long, side: Int): Bitmap? {
    val tUs = tMs * 1000
    val scale = min(1f, side.toFloat() / max(clip.storedW, clip.storedH))
    val frame = if (Build.VERSION.SDK_INT >= 27) {
      r.getScaledFrameAtTime(
        tUs, MediaMetadataRetriever.OPTION_CLOSEST,
        (clip.storedW * scale).roundToInt(), (clip.storedH * scale).roundToInt(),
      )
    } else {
      r.getFrameAtTime(tUs, MediaMetadataRetriever.OPTION_CLOSEST)
    } ?: return null
    // Some versions hand the frame back already upright, some as stored: the
    // shape says which. A quarter-turned clip whose frame still has the
    // stored shape is turned here.
    val storedShape = (frame.width >= frame.height) == (clip.storedW >= clip.storedH)
    if (clip.rotation % 180 != 0 && storedShape) {
      val turned = Bitmap.createBitmap(frame, 0, 0, frame.width, frame.height, rotationMatrix(clip.rotation), true)
      if (turned !== frame) frame.recycle()
      return turned
    }
    return frame
  }

  private fun box(r: Rect, scale: Float): Map<String, Any> = mapOf(
    "x" to (r.left * scale).toDouble(),
    "y" to (r.top * scale).toDouble(),
    "w" to (r.width() * scale).toDouble(),
    "h" to (r.height() * scale).toDouble(),
  )

  /** Faces every faceEveryMs and text every textEveryMs, from 0 to the end,
   *  in upright pixels of the clip. */
  fun analyze(
    clip: Clip,
    faceEveryMs: Int,
    textEveryMs: Int,
    faces: Boolean,
    text: Boolean,
    progress: (Int, Int) -> Unit,
  ): Map<String, Any> {
    val step = max(50, faceEveryMs).toLong()
    val textEvery = max(step, textEveryMs.toLong())
    // from the first frame to the last, so neither end of the clip goes unlooked
    val times = generateSequence(0L) { it + step }.takeWhile { it < clip.durationMs }.toList() +
      max(0L, clip.durationMs - 1)
    val samples = mutableListOf<Map<String, Any>>()
    val r = MediaMetadataRetriever()
    try {
      r.setDataSource(clip.path)
      var lastText = -textEvery
      times.forEachIndexed { i, t ->
        val readNow = text && t - lastText >= textEvery
        val side = if (readNow) READ_SIDE else LOOK_SIDE
        val frame = frameAt(r, clip, t, side)
        if (frame != null) {
          try {
            val scale = clip.uprightW.toFloat() / frame.width
            val image = InputImage.fromBitmap(frame, 0)
            val faceBoxes = if (faces) {
              Tasks.await(fastFaces.process(image), ML_TIMEOUT_S, TimeUnit.SECONDS).map { box(it.boundingBox, scale) }
            } else emptyList()
            val lines = mutableListOf<Map<String, Any>>()
            if (readNow) {
              lastText = t
              val read = Tasks.await(reader.process(image), ML_TIMEOUT_S, TimeUnit.SECONDS)
              read.textBlocks.forEachIndexed { b, block ->
                for (l in block.lines) {
                  val bb = l.boundingBox ?: continue
                  lines += mapOf("text" to l.text, "box" to box(bb, scale), "block" to b)
                }
              }
            }
            samples += mapOf("tMs" to t.toDouble(), "faces" to faceBoxes, "lines" to lines)
          } finally {
            frame.recycle()
          }
        }
        progress(i + 1, times.size)
      }
    } finally {
      r.release()
    }
    return mapOf(
      "width" to clip.uprightW, "height" to clip.uprightH, "durationMs" to clip.durationMs.toDouble(),
      "hdr" to clip.hdr, "samples" to samples,
    )
  }

  private val black = Paint().apply { color = Color.BLACK; style = Paint.Style.FILL }

  /** The clip with every span's regions covered by presentation time, encoded
   *  as H.264 no taller than maxLines, to `tmp`. Metadata is then stripped by
   *  Remux into the final file. Runs on the main looper, which Transformer
   *  requires; done/failed are called there. */
  @OptIn(UnstableApi::class)
  fun redact(
    context: Context,
    clip: Clip,
    spans: List<SpanRecord>,
    tmp: String,
    maxLines: Int,
    progress: (Int, Int) -> Unit,
    done: () -> Unit,
    failed: (String) -> Unit,
  ) {
    val main = Handler(Looper.getMainLooper())
    main.post {
      // Solid boxes for every region, faces too: an overlay is drawn over the
      // frame and cannot read the pixels under it to make a mosaic. A
      // pixelating shader would; until then a face is covered, not blurred.
      val overlay = object : CanvasOverlay(true) {
        override fun onDraw(canvas: Canvas, presentationTimeUs: Long) {
          canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
          val tMs = presentationTimeUs / 1000.0
          val cw = canvas.width.toFloat()
          val ch = canvas.height.toFloat()
          // The canvas has the frame's shape: upright, or as stored. Boxes are
          // upright, so a stored-shape canvas on a quarter-turned clip gets
          // them turned into its own pixels.
          val uprightShape = (cw >= ch) == (clip.uprightW >= clip.uprightH)
          val turn = if (clip.rotation % 180 != 0 && !uprightShape) clip.rotation else 0
          val sx = if (turn == 0) cw / clip.uprightW else cw / clip.storedW
          val sy = if (turn == 0) ch / clip.uprightH else ch / clip.storedH
          for (s in spans) {
            if (tMs < s.fromMs || tMs >= s.toMs) continue
            for (r in s.regions) {
              val b = if (turn == 0) {
                floatArrayOf(r.box.x.toFloat(), r.box.y.toFloat(), r.box.w.toFloat(), r.box.h.toFloat())
              } else {
                uprightToStored(
                  r.box.x.toFloat(), r.box.y.toFloat(), r.box.w.toFloat(), r.box.h.toFloat(),
                  turn, clip.storedW.toFloat(), clip.storedH.toFloat(),
                )
              }
              canvas.drawRect(b[0] * sx, b[1] * sy, (b[0] + b[2]) * sx, (b[1] + b[3]) * sy, black)
            }
          }
        }
      }
      val effects = mutableListOf<Effect>(OverlayEffect(ImmutableList.of<TextureOverlay>(overlay)))
      val shortSide = min(clip.uprightW, clip.uprightH)
      if (shortSide > maxLines) {
        val k = maxLines.toFloat() / shortSide
        effects += Presentation.createForWidthAndHeight(
          even(clip.uprightW * k), even(clip.uprightH * k), Presentation.LAYOUT_SCALE_TO_FIT,
        )
      }
      val item = EditedMediaItem.Builder(MediaItem.fromUri(Uri.fromFile(File(clip.path))))
        .setEffects(Effects(ImmutableList.of<AudioProcessor>(), effects))
        .build()
      val holder = ProgressHolder()
      lateinit var transformer: Transformer
      val poll = object : Runnable {
        override fun run() {
          if (transformer.getProgress(holder) == Transformer.PROGRESS_STATE_AVAILABLE) progress(holder.progress, 100)
          main.postDelayed(this, 500)
        }
      }
      transformer = Transformer.Builder(context)
        .setVideoMimeType(MimeTypes.VIDEO_H264)
        .addListener(object : Transformer.Listener {
          override fun onCompleted(composition: Composition, exportResult: ExportResult) {
            main.removeCallbacks(poll)
            done()
          }

          override fun onError(composition: Composition, exportResult: ExportResult, exportException: ExportException) {
            main.removeCallbacks(poll)
            failed(exportException.message ?: "the clip could not be encoded")
          }
        })
        .build()
      transformer.start(item, tmp)
      main.postDelayed(poll, 500)
    }
  }

  private fun even(v: Float): Int = max(2, (v.roundToInt() / 2) * 2)
}
