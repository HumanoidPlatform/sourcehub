package expo.modules.deidentify

import android.net.Uri
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.File
import java.util.concurrent.Executors

// The phone's de-identification (modules/deidentify/index.ts). The deciding is
// done in TypeScript (qa_pipeline/privacy); this finds faces and text, and
// draws the covers it is handed. Every failure rejects the promise, and the
// capture pipeline refuses the capture: nothing here ever hands back a file
// it did not finish.

/** Bumped whenever what this module does to a file changes; sent with every
 *  capture it cleaned, so a fault found later can be traced to its builds. */
private const val VERSION = 1

class BoxRecord : Record {
  @Field var x: Double = 0.0
  @Field var y: Double = 0.0
  @Field var w: Double = 0.0
  @Field var h: Double = 0.0
}

class RegionRecord : Record {
  @Field var box: BoxRecord = BoxRecord()
  @Field var style: String = "pixelate"
}

class SpanRecord : Record {
  @Field var fromMs: Double = 0.0
  @Field var toMs: Double = 0.0
  @Field var regions: List<RegionRecord> = emptyList()
}

class DeidentifyModule : Module() {
  // copying a cleaned clip is file I/O: never on the main thread
  private val io = Executors.newSingleThreadExecutor()

  override fun definition() = ModuleDefinition {
    Name("Deidentify")
    Events("onProgress")
    Constant("version") { VERSION }

    AsyncFunction("analyzeImage") { uri: String, faces: Boolean, text: Boolean ->
      Photos.analyze(pathOf(uri), faces, text)
    }

    AsyncFunction("redactImage") { uri: String, regions: List<RegionRecord>, out: String, quality: Double ->
      Photos.redact(pathOf(uri), regions, pathOf(out), quality)
    }

    AsyncFunction("analyzeVideo") { uri: String, faceEveryMs: Int, textEveryMs: Int, faces: Boolean, text: Boolean, job: String ->
      Videos.analyze(Clip(pathOf(uri)), faceEveryMs, textEveryMs, faces, text) { done, total -> emit(job, done, total) }
    }

    AsyncFunction("redactVideo") { uri: String, spans: List<SpanRecord>, out: String, maxLines: Int, job: String, promise: Promise ->
      val clip = Clip(pathOf(uri))
      val outPath = pathOf(out)
      val encoded = "$outPath.enc.mp4"
      val context = appContext.reactContext?.applicationContext
        ?: throw IllegalStateException("the app is not ready")
      Videos.redact(
        context, clip, spans, encoded, maxLines,
        progress = { done, total -> emit(job, done, total) },
        done = {
          io.execute {
            try {
              // Transformer's output, copied with no metadata at all
              Remux.copy(encoded, outPath)
              promise.resolve(written(outPath))
            } catch (e: Exception) {
              File(outPath).delete()
              promise.reject("ERR_DEIDENTIFY", e.message ?: "the cleaned clip could not be written", e)
            } finally {
              File(encoded).delete()
            }
          }
        },
        failed = { message ->
          File(encoded).delete()
          promise.reject("ERR_DEIDENTIFY", message, null)
        },
      )
    }

    AsyncFunction("remuxVideo") { uri: String, out: String ->
      val outPath = pathOf(out)
      try {
        Remux.copy(pathOf(uri), outPath)
      } catch (e: Exception) {
        File(outPath).delete()
        throw e
      }
      written(outPath)
    }
  }

  private fun emit(job: String, done: Int, total: Int) {
    sendEvent("onProgress", mapOf("job" to job, "done" to done, "total" to total))
  }

  private fun pathOf(uri: String): String =
    if (uri.startsWith("file://")) Uri.parse(uri).path ?: uri.removePrefix("file://") else uri

  private fun written(path: String): Map<String, Any> {
    val c = Clip(path)
    return mapOf(
      "uri" to "file://$path", "width" to c.uprightW, "height" to c.uprightH,
      "bytes" to File(path).length().toDouble(), "durationMs" to c.durationMs.toDouble(),
    )
  }
}
