package expo.modules.deidentify

import android.graphics.Matrix
import android.graphics.Rect
import androidx.exifinterface.media.ExifInterface

// Boxes cross the bridge in pixels of the UPRIGHT picture: what a viewer shows
// after the EXIF orientation is applied. A photo is decoded raw (the sensor's
// own orientation), so detection rotates a copy upright first, and drawing maps
// each upright box back into raw pixels; the JPEG written keeps the raw pixels
// and only the orientation tag, which is the one EXIF field it carries.

/** True for the EXIF orientations stored a quarter turn from how they display. */
fun quarterTurned(orientation: Int): Boolean = orientation in 5..8

/** The matrix that turns a raw bitmap upright for this EXIF orientation. */
fun uprightMatrix(orientation: Int): Matrix {
  val m = Matrix()
  when (orientation) {
    ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> m.setScale(-1f, 1f)
    ExifInterface.ORIENTATION_ROTATE_180 -> m.setRotate(180f)
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> {
      m.setRotate(180f)
      m.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_TRANSPOSE -> {
      m.setRotate(90f)
      m.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_ROTATE_90 -> m.setRotate(90f)
    ExifInterface.ORIENTATION_TRANSVERSE -> {
      m.setRotate(-90f)
      m.postScale(-1f, 1f)
    }
    ExifInterface.ORIENTATION_ROTATE_270 -> m.setRotate(-90f)
  }
  return m
}

/** An upright box (x, y, w, h) as a rect in the raw bitmap, W x H raw pixels.
 *  The inverse of uprightMatrix, worked per orientation. */
fun uprightToRaw(x: Int, y: Int, w: Int, h: Int, orientation: Int, rawW: Int, rawH: Int): Rect {
  val (rx, ry, rw, rh) = when (orientation) {
    ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> listOf(rawW - (x + w), y, w, h)
    ExifInterface.ORIENTATION_ROTATE_180 -> listOf(rawW - (x + w), rawH - (y + h), w, h)
    ExifInterface.ORIENTATION_FLIP_VERTICAL -> listOf(x, rawH - (y + h), w, h)
    ExifInterface.ORIENTATION_TRANSPOSE -> listOf(y, x, h, w)
    ExifInterface.ORIENTATION_ROTATE_90 -> listOf(y, rawH - (x + w), h, w)
    ExifInterface.ORIENTATION_TRANSVERSE -> listOf(rawW - (y + h), rawH - (x + w), h, w)
    ExifInterface.ORIENTATION_ROTATE_270 -> listOf(rawW - (y + h), x, h, w)
    else -> listOf(x, y, w, h)
  }
  val left = rx.coerceIn(0, rawW)
  val top = ry.coerceIn(0, rawH)
  return Rect(left, top, (rx + rw).coerceIn(left, rawW), (ry + rh).coerceIn(top, rawH))
}

/** A clip's frame turned upright by its rotation metadata (0, 90, 180, 270). */
fun rotationMatrix(degrees: Int): Matrix = Matrix().apply { if (degrees != 0) setRotate(degrees.toFloat()) }

/** An upright box as a rect in a frame stored `degrees` clockwise from upright,
 *  frameW x frameH stored pixels. */
fun uprightToStored(x: Float, y: Float, w: Float, h: Float, degrees: Int, frameW: Float, frameH: Float): FloatArray =
  when (((degrees % 360) + 360) % 360) {
    90 -> floatArrayOf(y, frameH - (x + w), h, w)
    180 -> floatArrayOf(frameW - (x + w), frameH - (y + h), w, h)
    270 -> floatArrayOf(frameW - (y + h), x, h, w)
    else -> floatArrayOf(x, y, w, h)
  }
