package uz.schoolday.app.presentation.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material3.*
import androidx.compose.runtime.*
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.BiometricHelper
import uz.schoolday.app.util.findFragmentActivity
import uz.schoolday.app.util.PinCode
import uz.schoolday.app.util.tr

/**
 * Shown at app start when fingerprint login is on. The fingerprint prompt opens by itself; the PIN
 * set together with it is the other way in (5 wrong tries sign out). Without a working sensor
 * only the PIN opens it; without a PIN either, the user signs in with the password.
 */
@Composable
fun BiometricLockScreen(
    pinHash: String?,
    onUnlocked: () -> Unit,
    onPinSet: (String) -> Unit,
    onUsePassword: () -> Unit
) {
    val context = LocalContext.current
    val colors = SchoolDayTheme.colors
    var error by remember { mutableStateOf<String?>(null) }
    val sensorReady = remember { BiometricHelper.unavailableReason(context) == null && context.findFragmentActivity() != null }
    var pin by remember { mutableStateOf("") }
    var wrongTries by remember { mutableIntStateOf(0) }
    // Turned on before PINs existed: the fingerprint opens it once, then a PIN must be chosen
    var mustSetPin by remember { mutableStateOf(false) }

    fun fingerprintOk() { if (pinHash == null) mustSetPin = true else onUnlocked() }

    fun prompt() {
        val activity = context.findFragmentActivity() ?: return
        error = null
        BiometricHelper.authenticate(
            activity = activity,
            title = "SchoolDay",
            subtitle = tr("Kirish uchun barmoq izi yoki yuzingizni tasdiqlang"),
            negativeText = if (pinHash != null) tr("PIN kod") else tr("Bekor qilish"),
            onSuccess = ::fingerprintOk,
            onFailure = { message -> if (message != null) error = message }
        )
    }

    LaunchedEffect(Unit) {
        when {
            sensorReady -> prompt()
            pinHash == null -> onUsePassword() // no sensor and no PIN: only the password is left
        }
    }

    if (mustSetPin) {
        PinSetupDialog(onDismiss = {}, onSet = { onPinSet(it); onUnlocked() }, dismissible = false)
    }

    var errorKey by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .systemBarsPadding()
            .padding(vertical = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.weight(1f))
        PinHeader(
            title = tr("SchoolDay qulflangan"),
            message = error ?: if (pinHash != null) tr("PIN kodni kiriting") else tr("Davom etish uchun barmoq izi yoki yuz orqali tasdiqlang"),
            isError = error != null
        )
        Spacer(Modifier.height(28.dp))
        if (pinHash != null) {
            PinDots(pin.length, errorKey)
            Spacer(Modifier.weight(1f))
            PinPad(
                value = pin,
                onValueChange = { pin = it; error = null },
                onComplete = { value ->
                    scope.launch {
                        kotlinx.coroutines.delay(120)
                        if (PinCode.matches(value, pinHash)) onUnlocked()
                        else {
                            wrongTries++
                            pin = ""
                            errorKey++
                            if (wrongTries >= MAX_PIN_TRIES) onUsePassword()
                            else error = tr("PIN kod noto'g'ri. Yana %s ta urinish qoldi.", MAX_PIN_TRIES - wrongTries)
                        }
                    }
                },
                onBiometric = if (sensorReady) ({ prompt() }) else null
            )
        } else {
            Spacer(Modifier.weight(1f))
            Button(
                onClick = { prompt() },
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.padding(horizontal = 32.dp).fillMaxWidth().height(50.dp)
            ) {
                Icon(Icons.Outlined.Fingerprint, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text(tr("Ochish"))
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        TextButton(onClick = onUsePassword) {
            Text(tr("Parol bilan kirish"))
        }
    }
}

private const val MAX_PIN_TRIES = 5
