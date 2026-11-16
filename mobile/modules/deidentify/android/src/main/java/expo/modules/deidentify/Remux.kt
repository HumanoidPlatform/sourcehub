package expo.modules.deidentify

import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.media.MediaMetadataRetriever
import android.media.MediaMuxer
import java.nio.ByteBuffer

/** A clip copied sample for sample into a new MP4 with nothing else in it.
 *
 * The framework muxer writes a location only when asked (setLocation, never
 * called here) and copies no XMP, so the copy carries the picture, the sound
 * and the rotation, and no metadata at all. Only the first video and the
 * first audio track are copied: some phones store GPS or motion data as
 * extra tracks, and those stay behind. Used after Transformer has drawn the
 * covers, and alone where a task asked only for the location to go. */
object Remux {
  private const val DEFAULT_SAMPLE_BYTES = 8 * 1024 * 1024

  fun copy(src: String, out: String) {
    val ex = MediaExtractor()
    var muxer: MediaMuxer? = null
    try {
      ex.setDataSource(src)
      var videoIn = -1
      var audioIn = -1
      for (i in 0 until ex.trackCount) {
        val mime = ex.getTrackFormat(i).getString(MediaFormat.KEY_MIME) ?: continue
        if (videoIn < 0 && mime.startsWith("video/")) videoIn = i
        else if (audioIn < 0 && mime.startsWith("audio/")) audioIn = i
      }
      if (videoIn < 0) throw IllegalStateException("the clip has no picture")

      val videoFormat = ex.getTrackFormat(videoIn)
      val m = MediaMuxer(out, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
      muxer = m
      m.setOrientationHint(rotationOf(src, videoFormat))
      val videoOut = m.addTrack(videoFormat)
      val audioOut = if (audioIn >= 0) m.addTrack(ex.getTrackFormat(audioIn)) else -1
      m.start()

      val size = listOf(videoIn, audioIn).filter { it >= 0 }
        .map { t -> ex.getTrackFormat(t).let { if (it.containsKey(MediaFormat.KEY_MAX_INPUT_SIZE)) it.getInteger(MediaFormat.KEY_MAX_INPUT_SIZE) else 0 } }
        .maxOrNull()?.takeIf { it > 0 } ?: DEFAULT_SAMPLE_BYTES
      val buf = ByteBuffer.allocate(size)
      val info = MediaCodec.BufferInfo()
      for ((inTrack, outTrack) in listOf(videoIn to videoOut, audioIn to audioOut)) {
        if (inTrack < 0) continue
        ex.selectTrack(inTrack)
        ex.seekTo(0, MediaExtractor.SEEK_TO_CLOSEST_SYNC)
        while (true) {
          buf.clear()
          val n = ex.readSampleData(buf, 0)
          if (n < 0) break
          info.set(
            0, n, ex.sampleTime,
            if (ex.sampleFlags and MediaExtractor.SAMPLE_FLAG_SYNC != 0) MediaCodec.BUFFER_FLAG_KEY_FRAME else 0,
          )
          m.writeSampleData(outTrack, buf, info)
          ex.advance()
        }
        ex.unselectTrack(inTrack)
      }
      m.stop()
    } finally {
      try {
        muxer?.release()
      } catch (_: Exception) {
        // stop() failing already said what went wrong
      }
      ex.release()
    }
  }

  private fun rotationOf(src: String, format: MediaFormat): Int {
    if (format.containsKey(MediaFormat.KEY_ROTATION)) return format.getInteger(MediaFormat.KEY_ROTATION)
    val r = MediaMetadataRetriever()
    return try {
      r.setDataSource(src)
      r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toIntOrNull() ?: 0
    } finally {
      r.release()
    }
  }
}
