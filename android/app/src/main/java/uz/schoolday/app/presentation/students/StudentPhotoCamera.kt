package uz.schoolday.app.presentation.students

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Matrix
import androidx.annotation.OptIn
import androidx.camera.core.CameraSelector
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Cameraswitch
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import uz.schoolday.app.util.tr
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.Executors
import kotlin.math.abs

/** Oval face guide, as a fraction of the screen width; height = width × [OVAL_RATIO]. */
private const val OVAL_WIDTH = 0.68f
private const val OVAL_RATIO = 1.32f
/** The oval sits a bit above the middle, leaving room for the buttons. */
private const val OVAL_CENTER_Y = 0.44f

/**
 * Takes a student's face photo with an oval guide (like the web panel's webcam dialog), so the face
 * ends up centred and large enough for the face terminal. The oval turns green when ML Kit sees one
 * face inside it. Back camera by default (the staff photographs the student), front on demand.
 * Returns an upright JPEG, longest side ≤ 1280 px.
 */
@Composable
fun StudentPhotoCameraDialog(onCaptured: (File) -> Unit, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var front by remember { mutableStateOf(false) }
    var faceOk by remember { mutableStateOf(false) }
    var hint by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var taken by remember { mutableStateOf<Pair<File, Bitmap>?>(null) }
    val imageCapture = remember(front) {
        ImageCapture.Builder().setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY).build()
    }
    val ovalColor by animateColorAsState(if (faceOk) Color(0xFF3FCF8E) else Color.White, label = "oval")

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnClickOutside = false)
    ) {
        Box(Modifier.fillMaxSize().background(Color.Black)) {
            val shot = taken
            if (shot == null) {
                key(front) {
                    PhotoCameraPreview(context, lifecycleOwner, imageCapture, front,
                        onFace = { ok, h -> faceOk = ok; hint = h },
                        onError = { error = it })
                }
                OvalGuide(ovalColor)
            } else {
                Image(shot.second.asImageBitmap(), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                OvalGuide(Color(0xFF3FCF8E))
            }

            // Top bar
            Row(
                Modifier.align(Alignment.TopCenter).fillMaxWidth().statusBarsPadding().padding(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onDismiss) { Icon(Icons.Rounded.Close, tr("Bekor qilish"), tint = Color.White) }
                Text(tr("O'quvchi rasmi"), color = Color.White, style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                if (shot == null) {
                    IconButton(onClick = { front = !front; faceOk = false }) {
                        Icon(Icons.Rounded.Cameraswitch, tr("Kamerani almashtirish"), tint = Color.White)
                    }
                }
            }

            // Bottom: instruction + buttons
            Column(
                Modifier.align(Alignment.BottomCenter).fillMaxWidth().navigationBarsPadding().padding(start = 24.dp, end = 24.dp, bottom = 32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                val text = when {
                    error != null -> error!!
                    shot != null -> tr("Yuz oval ichida va aniq ko'rinsa, tasdiqlang")
                    faceOk -> tr("Yaxshi! Rasmga oling")
                    else -> hint ?: tr("Yuzni oval ichiga joylashtiring")
                }
                Text(
                    text, color = if (error != null) Color(0xFFF07178) else Color.White,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(14.dp)).padding(horizontal = 16.dp, vertical = 10.dp)
                )
                if (shot == null) {
                    Box(
                        Modifier.size(76.dp).border(4.dp, Color.White, CircleShape).padding(8.dp)
                            .background(if (busy) Color.White.copy(alpha = 0.4f) else Color.White, CircleShape)
                            .clickable(enabled = !busy) {
                                busy = true; error = null
                                capturePhoto(context, imageCapture, front,
                                    onDone = { file, preview -> busy = false; taken = file to preview },
                                    onError = { busy = false; error = tr("Rasmga olib bo'lmadi. Qayta urinib ko'ring.") })
                            },
                        contentAlignment = Alignment.Center
                    ) { if (busy) CircularProgressIndicator(Modifier.size(28.dp), color = Color.Black) }
                } else {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(onClick = { shot.first.delete(); taken = null }) {
                            Icon(Icons.Rounded.Refresh, null, tint = Color.White); Spacer(Modifier.width(6.dp))
                            Text(tr("Qayta olish"), color = Color.White)
                        }
                        Button(onClick = { onCaptured(shot.first) }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))) {
                            Icon(Icons.Rounded.Check, null); Spacer(Modifier.width(6.dp)); Text(tr("Tasdiqlash"))
                        }
                    }
                }
            }
        }
    }
}

/** Dims everything except an oval in the middle and outlines it. */
@Composable
private fun OvalGuide(color: Color) {
    Canvas(Modifier.fillMaxSize().graphicsLayer { compositingStrategy = CompositingStrategy.Offscreen }) {
        val w = size.width * OVAL_WIDTH
        val h = w * OVAL_RATIO
        val topLeft = Offset((size.width - w) / 2f, size.height * OVAL_CENTER_Y - h / 2f)
        drawRect(Color.Black.copy(alpha = 0.55f))
        drawOval(Color.Transparent, topLeft, Size(w, h), blendMode = BlendMode.Clear)
        drawOval(color, topLeft, Size(w, h), style = Stroke(width = 4.dp.toPx()))
    }
}

@Composable
private fun PhotoCameraPreview(
    context: Context,
    lifecycleOwner: LifecycleOwner,
    imageCapture: ImageCapture,
    front: Boolean,
    onFace: (ok: Boolean, hint: String?) -> Unit,
    onError: (String) -> Unit
) {
    val previewView = remember {
        PreviewView(context).apply {
            implementationMode = PreviewView.ImplementationMode.COMPATIBLE // TextureView: visible inside a dialog
            scaleType = PreviewView.ScaleType.FILL_CENTER
        }
    }
    val latestOnFace by rememberUpdatedState(onFace)

    DisposableEffect(lifecycleOwner, front) {
        val executor = Executors.newSingleThreadExecutor()
        val detector = FaceDetection.getClient(
            FaceDetectorOptions.Builder().setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST).setMinFaceSize(0.15f).build()
        )
        val analysis = ImageAnalysis.Builder().setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST).build()
            .also { it.setAnalyzer(executor) { proxy -> analyzeFace(proxy, detector) { faces, w, h -> latestOnFace(judge(faces, w, h).first, judge(faces, w, h).second) } } }
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            try {
                val provider = future.get()
                val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
                provider.unbindAll()
                val selector = if (front) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
                provider.bindToLifecycle(lifecycleOwner, selector, preview, imageCapture, analysis)
            } catch (e: Exception) {
                onError(tr("Kamerani ochib bo'lmadi"))
            }
        }, ContextCompat.getMainExecutor(context))

        onDispose {
            runCatching { future.get().unbindAll() }
            detector.close()
            executor.shutdown()
        }
    }

    AndroidView(factory = { previewView }, modifier = Modifier.fillMaxSize())
}

/** One face, roughly centred where the oval is, and big enough → ok; otherwise a hint. */
private fun judge(faces: List<Face>, frameW: Int, frameH: Int): Pair<Boolean, String?> {
    if (faces.isEmpty()) return false to tr("Yuz ko'rinmayapti")
    if (faces.size > 1) return false to tr("Kadrda faqat bitta odam bo'lsin")
    val box = faces.first().boundingBox
    val cx = box.centerX() / frameW.toFloat()
    val cy = box.centerY() / frameH.toFloat()
    val share = box.width() / frameW.toFloat()
    return when {
        share < 0.28f -> false to tr("Yaqinroq keling")
        share > 0.75f -> false to tr("Biroz uzoqroq turing")
        abs(cx - 0.5f) > 0.15f || abs(cy - OVAL_CENTER_Y) > 0.18f -> false to tr("Yuzni oval markaziga keltiring")
        abs(faces.first().headEulerAngleY) > 15 -> false to tr("To'g'ri qarang")
        else -> true to null
    }
}

@OptIn(ExperimentalGetImage::class)
private fun analyzeFace(
    proxy: ImageProxy,
    detector: com.google.mlkit.vision.face.FaceDetector,
    onResult: (List<Face>, Int, Int) -> Unit
) {
    val media = proxy.image ?: return proxy.close()
    val rotation = proxy.imageInfo.rotationDegrees
    val upright = rotation == 90 || rotation == 270
    val w = if (upright) proxy.height else proxy.width
    val h = if (upright) proxy.width else proxy.height
    detector.process(InputImage.fromMediaImage(media, rotation))
        .addOnSuccessListener { onResult(it, w, h) }
        .addOnCompleteListener { proxy.close() }
}

private fun capturePhoto(
    context: Context,
    imageCapture: ImageCapture,
    front: Boolean,
    onDone: (File, Bitmap) -> Unit,
    onError: () -> Unit
) {
    imageCapture.takePicture(ContextCompat.getMainExecutor(context), object : ImageCapture.OnImageCapturedCallback() {
        override fun onCaptureSuccess(image: ImageProxy) {
            val result = try {
                val source = image.toBitmap()
                val scale = (1280f / maxOf(source.width, source.height)).coerceAtMost(1f)
                val matrix = Matrix().apply {
                    postRotate(image.imageInfo.rotationDegrees.toFloat())
                    postScale(if (front) -scale else scale, scale) // front: mirror like the preview
                }
                val upright = Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
                if (upright !== source) source.recycle()
                val file = File(context.cacheDir, "student_cam_${System.currentTimeMillis()}.jpg")
                FileOutputStream(file).use { upright.compress(Bitmap.CompressFormat.JPEG, 90, it) }
                file to upright
            } catch (e: Exception) {
                null
            } finally {
                image.close()
            }
            if (result != null) onDone(result.first, result.second) else onError()
        }

        override fun onError(exception: ImageCaptureException) = onError()
    })
}
