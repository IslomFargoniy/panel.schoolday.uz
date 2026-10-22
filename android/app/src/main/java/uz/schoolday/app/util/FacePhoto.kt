package uz.schoolday.app.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * Turns a camera / gallery picture into the photo a Face ID terminal accepts: upright, exactly one
 * clearly visible face, cropped around it and saved as a small JPEG (terminals reject big files).
 * Without Google Play services (no face model) the check is skipped and the centre is cropped.
 */
object FacePhoto {
    sealed class Result {
        data class Ok(val file: File) : Result()
        data class Rejected(val message: String) : Result()
    }

    private const val OUTPUT_SIZE = 720
    private const val MIN_FACE_FRACTION = 0.18f

    suspend fun prepare(context: Context, uri: Uri): Result = withContext(Dispatchers.Default) {
        val bitmap = decodeUpright(context, uri) ?: return@withContext Result.Rejected(tr("Rasmni o'qib bo'lmadi"))

        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .build()
        val detector = FaceDetection.getClient(options)
        val faces = try {
            detector.process(InputImage.fromBitmap(bitmap, 0)).await()
        } catch (e: Exception) {
            null
        } finally {
            detector.close()
        }
        if (faces == null) {
            return@withContext Result.Ok(save(context, centreSquare(bitmap)))
        }

        when {
            faces.isEmpty() -> return@withContext Result.Rejected(tr("Rasmda yuz topilmadi. Yuz to'liq ko'rinadigan rasm tanlang."))
            faces.size > 1 -> return@withContext Result.Rejected(tr("Rasmda bir nechta yuz bor. Faqat o'quvchi tushgan rasm kerak."))
        }
        val box = faces.first().boundingBox
        if (box.width() < bitmap.width * MIN_FACE_FRACTION) {
            return@withContext Result.Rejected(tr("Yuz juda kichik. Yaqinroqdan suratga oling."))
        }

        // Square around the face with room for hair and chin, kept inside the picture
        val side = min(max(box.width(), box.height()) * 2.2f, min(bitmap.width, bitmap.height).toFloat()).roundToInt()
        val left = (box.centerX() - side / 2).coerceIn(0, bitmap.width - side)
        val top = (box.centerY() - side / 2).coerceIn(0, bitmap.height - side)
        Result.Ok(save(context, Bitmap.createBitmap(bitmap, left, top, side, side)))
    }

    private fun centreSquare(bitmap: Bitmap): Bitmap {
        val side = min(bitmap.width, bitmap.height)
        return Bitmap.createBitmap(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side)
    }

    private fun save(context: Context, square: Bitmap): File {
        val scaled = if (square.width > OUTPUT_SIZE) Bitmap.createScaledBitmap(square, OUTPUT_SIZE, OUTPUT_SIZE, true) else square
        val dir = File(context.cacheDir, "faces").apply { mkdirs() }
        val file = File(dir, "face_${System.currentTimeMillis()}.jpg")
        file.outputStream().use { scaled.compress(Bitmap.CompressFormat.JPEG, 88, it) }
        return file
    }

    /** Decodes at a sane size and applies the EXIF rotation (camera pictures are often stored sideways). */
    private fun decodeUpright(context: Context, uri: Uri): Bitmap? = try {
        val resolver = context.contentResolver
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= 1600) sample *= 2
        val bitmap = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, BitmapFactory.Options().apply { inSampleSize = sample }) }
            ?: return null
        val rotation = resolver.openInputStream(uri)?.use { ExifInterface(it).rotationDegrees } ?: 0
        if (rotation == 0) bitmap
        else Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, Matrix().apply { postRotate(rotation.toFloat()) }, true)
    } catch (e: Exception) {
        null
    }

    private suspend fun <T> Task<T>.await(): T = suspendCancellableCoroutine { cont ->
        addOnSuccessListener { cont.resume(it) }
        addOnFailureListener { cont.resumeWithException(it) }
    }
}
