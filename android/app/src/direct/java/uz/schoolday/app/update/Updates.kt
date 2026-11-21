package uz.schoolday.app.update

import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.tr

/** Checks for a newer APK once per launch (in the background) and offers to update. */
@Composable
fun UpdatePrompt() {
    val context = LocalContext.current
    val updater = remember { AppUpdater(context.applicationContext) }
    var version by remember { mutableStateOf<AppVersion?>(null) }

    LaunchedEffect(Unit) { version = updater.newerVersion() }

    version?.let { UpdateDialog(it) { version = null } }
}

/** Profil → "Yangilanishni tekshirish": shows the update dialog, or says the app is up to date. */
@Composable
fun rememberUpdateChecker(): UpdateChecker {
    val context = LocalContext.current
    val updater = remember { AppUpdater(context.applicationContext) }
    val scope = rememberCoroutineScope()
    var isChecking by remember { mutableStateOf(false) }
    var found by remember { mutableStateOf<AppVersion?>(null) }

    found?.let { UpdateDialog(it) { found = null } }

    return UpdateChecker(isChecking = isChecking) {
        if (isChecking) return@UpdateChecker
        isChecking = true
        scope.launch {
            found = updater.newerVersion()
            isChecking = false
            if (found == null) {
                Toast.makeText(context, tr("Ilovaning eng so'nggi versiyasi o'rnatilgan"), Toast.LENGTH_SHORT).show()
            }
        }
    }
}

/**
 * Downloads the new APK inside the app and opens the system installer.
 * The first time Android asks to allow installing apps from SchoolDay.
 */
@Composable
fun UpdateDialog(available: AppVersion, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val updater = remember { AppUpdater(context.applicationContext) }
    val colors = SchoolDayTheme.colors
    var progress by remember { mutableStateOf<Float?>(null) }
    var failed by remember { mutableStateOf(false) }
    var needsPermission by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    AlertDialog(
        onDismissRequest = { if (progress == null) onDismiss() },
        shape = RoundedCornerShape(20.dp),
        title = { Text(tr("Yangi versiya: %s", available.versionName), fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    available.notes ?: tr("SchoolDay ilovasining yangi versiyasi chiqdi. Yangilab oling."),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (needsPermission) {
                    Text(
                        tr("SchoolDay'ga ilovalarni o'rnatishga ruxsat bering, so'ng \"Yangilash\"ni yana bosing."),
                        style = MaterialTheme.typography.bodyMedium,
                        color = colors.warning
                    )
                }
                progress?.let {
                    LinearProgressIndicator(
                        progress = { it },
                        modifier = Modifier.fillMaxWidth().height(6.dp),
                        trackColor = colors.surface2
                    )
                    Text(
                        tr("Yuklanmoqda... %s%%", (it * 100).toInt()),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                if (failed) {
                    Text(tr("Yangilanishni yuklab bo'lmadi. Internetni tekshirib, qayta urinib ko'ring."), color = colors.danger)
                    TextButton(onClick = { runCatching { updater.openDownload(available) } }) {
                        Text(tr("Brauzerda yuklab olish"))
                    }
                }
            }
        },
        confirmButton = {
            Button(
                enabled = progress == null,
                onClick = {
                    failed = false
                    if (!updater.canInstall()) {
                        needsPermission = true
                        runCatching { updater.openInstallPermissionSettings() }
                        return@Button
                    }
                    needsPermission = false
                    progress = 0f
                    scope.launch {
                        runCatching { updater.download(available) { progress = it } }
                            .onSuccess { runCatching { updater.install(it) }.onFailure { failed = true } }
                            .onFailure { failed = true }
                        progress = null
                    }
                }
            ) { Text(tr("Yangilash")) }
        },
        dismissButton = {
            if (progress == null) {
                TextButton(onClick = onDismiss) { Text(tr("Keyinroq")) }
            }
        }
    )
}
