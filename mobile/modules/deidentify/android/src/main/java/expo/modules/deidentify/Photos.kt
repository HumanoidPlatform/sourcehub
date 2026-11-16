package expo.modules.deidentify

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import androidx.exifinterface.media.ExifInterface
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit
import kotlin.math.max
import kotlin.math.min

/** Faces are looked for on a copy this wide at most: plenty for a face, and a
 *  12 MP original decoded whole would cost 48 MB beside the CLIP model. */
private const val FACE_SIDE = 2048

/** Text is read on tiles of the full-resolution picture, so a plate keeps the
 *  pixels per character the reader needs; tiles overlap so none is cut. */
private const val TILE_SIDE = 2200
private const val TILE_OVERLAP = 0.15

private const val ML_TIMEOUT_S = 20L

object Photos {
  private val accurateFaces by lazy {
    FaceDetection.getClient(
      FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .setMinFaceSize(0.03f)
        .build(),
    )
  }
  private val reader by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }

  fun orientationOf(path: String): Int =
    ExifInterface(path).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)

  private fun bounds(path: String): Pair<Int, Int> {
    val o = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(path, o)
    if (o.outWidth <= 0 || o.outHeight <= 0) throw IllegalStateException("the photo cannot be decoded")
    return o.outWidth to o.outHeight
  }

  private fun upright(raw: Bitmap, orientation: Int): Bitmap {
    if (orientation == ExifInterface.ORIENTATION_NORMAL || orientation == ExifInterface.ORIENTATION_UNDEFINED) return raw
    val turned = Bitmap.createBitmap(raw, 0, 0, raw.width, raw.height, uprightMatrix(orientation), true)
    if (turned !== raw) raw.recycle()
    return turned
  }

  /** Faces and lines of text, in upright pixels of the full picture. */
  fun analyze(path: String, faces: Boolean, text: Boolean): Map<String, Any> {
    val (rawW, rawH) = bounds(path)
    val orientation = orientationOf(path)
    val (w, h) = if (quarterTurned(orientation)) rawH to rawW else rawW to rawH

    val faceBoxes = mutableListOf<Map<String, Any>>()
    if (faces) {
      var sample = 1
      while (max(rawW, rawH) / (sample * 2) >= FACE_SIDE) sample *= 2
      val small = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inSampleSize = sample })
        ?: throw IllegalStateException("the photo cannot be decoded")
      val up = upright(small, orientation)
      try {
        val scale = w.toFloat() / up.width
        val found = Tasks.await(accurateFaces.process(InputImage.fromBitmap(up, 0)), ML_TIMEOUT_S, TimeUnit.SECONDS)
        for (f in found) faceBoxes += box(f.boundingBox, scale, 0, 0)
      } finally {
        up.recycle()
      }
    }

    val lines = mutableListOf<Map<String, Any>>()
    if (text) {
      // RGB_565 halves the memory of the full-resolution decode; the reader
      // does not need the alpha or the colour depth
      val full = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inPreferredConfig = Bitmap.Config.RGB_565 })
        ?: throw IllegalStateException("the photo cannot be decoded")
      val up = upright(full, orientation)
      try {
        var block = 0
        for (tile in tiles(up.width, up.height)) {
          val part = Bitmap.createBitmap(up, tile.left, tile.top, tile.width(), tile.height())
          try {
            val read = Tasks.await(reader.process(InputImage.fromBitmap(part, 0)), ML_TIMEOUT_S, TimeUnit.SECONDS)
            for (b in read.textBlocks) {
              for (l in b.lines) {
                val r = l.boundingBox ?: continue
                lines += mapOf("text" to l.text, "box" to box(r, 1f, tile.left, tile.top), "block" to block)
              }
              block++
            }
          } finally {
            if (part !== up) part.recycle()
          }
        }
      } finally {
        up.recycle()
      }
    }
    return mapOf("width" to w, "height" to h, "faces" to faceBoxes, "lines" to lines)
  }

  /** Overlapping tiles covering a w x h picture; one tile when it is small. */
  private fun tiles(w: Int, h: Int): List<Rect> {
    if (max(w, h) <= TILE_SIDE) return listOf(Rect(0, 0, w, h))
    val step = (TILE_SIDE * (1 - TILE_OVERLAP)).toInt()
    val out = mutableListOf<Rect>()
    var y = 0
    while (true) {
      var x = 0
      val bottom = min(h, y + TILE_SIDE)
      while (true) {
        val right = min(w, x + TILE_SIDE)
        out += Rect(max(0, right - TILE_SIDE), max(0, bottom - TILE_SIDE), right, bottom)
        if (right >= w) break
        x += step
      }
      if (bottom >= h) break
      y += step
    }
    return out
  }

  private fun box(r: Rect, scale: Float, dx: Int, dy: Int): Map<String, Any> = mapOf(
    "x" to (r.left * scale + dx).toDouble(),
    "y" to (r.top * scale + dy).toDouble(),
    "w" to (r.width() * scale).toDouble(),
    "h" to (r.height() * scale).toDouble(),
  )

  private val black = Paint().apply { color = Color.BLACK; style = Paint.Style.FILL }

  /** The photo with its regions covered, written to `out` as a JPEG carrying
   *  no EXIF but the orientation: no location, no thumbnail, no camera serial. */
  fun redact(path: String, regions: List<RegionRecord>, out: String, quality: Double): Map<String, Any> {
    val orientation = orientationOf(path)
    val raw = BitmapFactory.decodeFile(path, BitmapFactory.Options().apply { inMutable = true })
      ?: throw IllegalStateException("the photo cannot be decoded")
    try {
      val canvas = Canvas(raw)
      for (r in regions) {
        val rect = uprightToRaw(
          r.box.x.toInt(), r.box.y.toInt(), r.box.w.toInt(), r.box.h.toInt(), orientation, raw.width, raw.height,
        )
        if (rect.width() <= 0 || rect.height() <= 0) continue
        if (r.style == "fill") canvas.drawRect(rect, black) else pixelate(raw, canvas, rect)
      }
      val file = File(out)
      FileOutputStream(file).use { os ->
        if (!raw.compress(Bitmap.CompressFormat.JPEG, (quality * 100).toInt().coerceIn(50, 100), os)) {
          throw IllegalStateException("the photo could not be written")
        }
      }
      // the one tag kept: without it a portrait shot displays on its side
      if (orientation != ExifInterface.ORIENTATION_NORMAL && orientation != ExifInterface.ORIENTATION_UNDEFINED) {
        ExifInterface(out).apply {
          setAttribute(ExifInterface.TAG_ORIENTATION, orientation.toString())
          saveAttributes()
        }
      }
      val (w, h) = if (quarterTurned(orientation)) raw.height to raw.width else raw.width to raw.height
      return mapOf("uri" to "file://$out", "width" to w, "height" to h, "bytes" to file.length().toDouble())
    } finally {
      raw.recycle()
    }
  }

  /** A coarse mosaic over the rect: about seven cells across its longer side,
   *  too few to recognise anyone by. */
  private fun pixelate(src: Bitmap, canvas: Canvas, rect: Rect) {
    val cell = max(8, max(rect.width(), rect.height()) / 7)
    val part = Bitmap.createBitmap(src, rect.left, rect.top, rect.width(), rect.height())
    val tiny = Bitmap.createScaledBitmap(part, max(1, rect.width() / cell), max(1, rect.height() / cell), true)
    val blocky = Bitmap.createScaledBitmap(tiny, rect.width(), rect.height(), false)
    canvas.drawBitmap(blocky, rect.left.toFloat(), rect.top.toFloat(), null)
    part.recycle()
    tiny.recycle()
    blocky.recycle()
  }
}
