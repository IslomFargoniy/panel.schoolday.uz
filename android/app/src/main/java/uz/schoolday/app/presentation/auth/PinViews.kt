package uz.schoolday.app.presentation.auth

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Backspace
import androidx.compose.material.icons.outlined.Fingerprint
import androidx.compose.material.icons.outlined.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.launch
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.PinCode
import uz.schoolday.app.util.tr

/** 4 dots filling up as digits are typed; shakes on [errorKey] change. */
@Composable
fun PinDots(length: Int, errorKey: Int) {
    val c = SchoolDayTheme.colors
    val shake = remember { Animatable(0f) }
    LaunchedEffect(errorKey) {
        if (errorKey == 0) return@LaunchedEffect
        for (x in listOf(18f, -16f, 12f, -8f, 4f, 0f)) shake.animateTo(x, tween(45))
    }
    Row(
        horizontalArrangement = Arrangement.spacedBy(20.dp),
        modifier = Modifier.offset { IntOffset(shake.value.dp.roundToPx(), 0) }
    ) {
        repeat(PinCode.LENGTH) { i ->
            val filled = i < length
            Box(
                Modifier.size(18.dp).clip(CircleShape)
                    .background(if (filled) MaterialTheme.colorScheme.primary else androidx.compose.ui.graphics.Color.Transparent)
                    .border(2.dp, if (filled) MaterialTheme.colorScheme.primary else c.borderStrong, CircleShape)
            )
        }
    }
}

/**
 * Bank-style number pad: 1–9, then [biometric] (fingerprint / face, or empty), 0 and delete.
 * Feeds digits until [PinCode.LENGTH], then [onComplete] gets the PIN.
 */
@Composable
fun PinPad(
    value: String,
    onValueChange: (String) -> Unit,
    onComplete: (String) -> Unit,
    onBiometric: (() -> Unit)? = null
) {
    val haptic = LocalHapticFeedback.current
    fun press(d: Char) {
        if (value.length >= PinCode.LENGTH) return
        haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
        val next = value + d
        onValueChange(next)
        if (next.length == PinCode.LENGTH) onComplete(next)
    }
    val rows = listOf(listOf('1', '2', '3'), listOf('4', '5', '6'), listOf('7', '8', '9'))
    Column(verticalArrangement = Arrangement.spacedBy(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        rows.forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(26.dp)) { row.forEach { d -> DigitKey(d.toString()) { press(d) } } }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(26.dp)) {
            if (onBiometric != null) IconKey(Icons.Outlined.Fingerprint, tr("Barmoq izi yoki yuz"), onBiometric)
            else Spacer(Modifier.size(KEY))
            DigitKey("0") { press('0') }
            IconKey(Icons.AutoMirrored.Outlined.Backspace, tr("O'chirish")) {
                if (value.isNotEmpty()) onValueChange(value.dropLast(1))
            }
        }
    }
}

private val KEY = 76.dp

@Composable
private fun DigitKey(label: String, onClick: () -> Unit) {
    Box(
        Modifier.size(KEY).clip(CircleShape).background(SchoolDayTheme.colors.surface2).clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(label, style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Medium, fontSize = 30.sp))
    }
}

@Composable
private fun IconKey(icon: ImageVector, description: String, onClick: () -> Unit) {
    Box(Modifier.size(KEY).clip(CircleShape).clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Icon(icon, description, tint = MaterialTheme.colorScheme.onSurface, modifier = Modifier.size(30.dp))
    }
}

/** Lock icon, title and a line of help (red when it is an error) above the dots. */
@Composable
fun PinHeader(title: String, message: String, isError: Boolean) {
    val c = SchoolDayTheme.colors
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            Modifier.size(72.dp).clip(CircleShape).background(c.indigoBg).border(1.dp, c.borderStrong, CircleShape),
            contentAlignment = Alignment.Center
        ) { Icon(Icons.Outlined.Lock, null, tint = c.accentText, modifier = Modifier.size(36.dp)) }
        Spacer(Modifier.height(18.dp))
        Text(title, style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold), textAlign = TextAlign.Center)
        Spacer(Modifier.height(6.dp))
        Text(
            message, style = MaterialTheme.typography.bodyMedium, textAlign = TextAlign.Center,
            color = if (isError) c.danger else MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 24.dp)
        )
    }
}

/**
 * Full-screen PIN choice, like bank apps: type 4 digits, then the same again.
 * Required whenever fingerprint / face login is turned on. [dismissible] false = can't be skipped.
 */
@Composable
fun PinSetupDialog(onDismiss: () -> Unit, onSet: (String) -> Unit, dismissible: Boolean = true) {
    var first by remember { mutableStateOf<String?>(null) }
    var value by remember { mutableStateOf("") }
    var error by remember { mutableStateOf(false) }
    var errorKey by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    Dialog(
        onDismissRequest = { if (dismissible) onDismiss() },
        properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnBackPress = dismissible, dismissOnClickOutside = false)
    ) {
        Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
            Column(
                Modifier.fillMaxSize().systemBarsPadding().padding(vertical = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp)) {
                    if (dismissible) TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) }
                }
                Spacer(Modifier.weight(1f))
                PinHeader(
                    title = if (first == null) tr("PIN kod o'ylab toping") else tr("PIN kodni takrorlang"),
                    message = when {
                        error -> tr("PIN kodlar mos emas. Qaytadan kiriting.")
                        first == null -> tr("Barmoq izi yoki yuz o'qilmasa, ilovaga shu 4 xonali PIN bilan kirasiz.")
                        else -> tr("Tasdiqlash uchun yana bir marta kiriting")
                    },
                    isError = error
                )
                Spacer(Modifier.height(28.dp))
                PinDots(value.length, errorKey)
                Spacer(Modifier.weight(1f))
                PinPad(value, { value = it; error = false }, onComplete = { pin ->
                    scope.launch {
                        kotlinx.coroutines.delay(120) // let the last dot show
                        val chosen = first
                        when {
                            chosen == null -> { first = pin; value = "" }
                            chosen == pin -> onSet(pin)
                            else -> { first = null; value = ""; error = true; errorKey++ }
                        }
                    }
                })
                Spacer(Modifier.height(16.dp))
            }
        }
    }
}
