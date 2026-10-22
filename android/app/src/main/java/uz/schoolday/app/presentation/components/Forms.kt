package uz.schoolday.app.presentation.components

import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.DeleteOutline
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.tr

/**
 * A create / edit screen: top bar (with an optional delete action), scrolling fields and a save
 * button pinned at the bottom. [error] shows above the fields.
 */
@Composable
fun FormScaffold(
    title: String,
    onBack: () -> Unit,
    onSave: () -> Unit,
    saving: Boolean,
    error: String? = null,
    saveLabel: String = tr("Saqlash"),
    onDelete: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    Scaffold(
        topBar = {
            SdTopBar(title = title, onBack = onBack) {
                if (onDelete != null) {
                    IconButton(onClick = onDelete) { Icon(Icons.Outlined.DeleteOutline, tr("O'chirish"), tint = SchoolDayTheme.colors.danger) }
                }
            }
        },
        bottomBar = {
            Surface(color = MaterialTheme.colorScheme.background) {
                Button(
                    onClick = onSave,
                    enabled = !saving,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().navigationBarsPadding().imePadding().padding(horizontal = 18.dp, vertical = 12.dp).height(50.dp)
                ) {
                    if (saving) CircularProgressIndicator(Modifier.size(22.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                    else Text(saveLabel, fontWeight = FontWeight.Bold)
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).verticalScroll(rememberScrollState()).padding(horizontal = 18.dp, vertical = 6.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            error?.let { ErrorBanner(it) }
            content()
            Spacer(Modifier.height(8.dp))
        }
    }
}

@Composable
fun SdTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
    placeholder: String? = null,
    supporting: String? = null,
    password: Boolean = false
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        placeholder = placeholder?.let { { Text(it) } },
        supportingText = supporting?.let { { Text(it) } },
        singleLine = singleLine,
        minLines = minLines,
        visualTransformation = if (password) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = KeyboardOptions(keyboardType = if (password) KeyboardType.Password else keyboardType),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.fillMaxWidth()
    )
}

/** Read-only field that opens a list to pick from. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun <T> SelectField(
    label: String,
    value: T,
    options: List<Pair<T, String>>,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = tr("Tanlang")
) {
    var open by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = open, onExpandedChange = { open = it }, modifier = modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = options.firstOrNull { it.first == value }?.second ?: "",
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            placeholder = { Text(placeholder) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(open) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().menuAnchor(MenuAnchorType.PrimaryNotEditable)
        )
        ExposedDropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            options.forEach { (v, text) ->
                DropdownMenuItem(text = { Text(text) }, onClick = { open = false; onSelect(v) })
            }
        }
    }
}

/** Title, optional hint and a switch, in a bordered row. */
@Composable
fun SwitchRow(title: String, checked: Boolean, onChange: (Boolean) -> Unit, subtitle: String? = null) {
    SdCard(padding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium))
                subtitle?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
            Switch(checked = checked, onCheckedChange = onChange)
        }
    }
}

/** "16:00:00" / "9:5" → "16:00" / "09:05"; anything unreadable → null. */
fun normalizeTime(value: String?): String? {
    val parts = value?.trim()?.split(":") ?: return null
    val h = parts.getOrNull(0)?.toIntOrNull() ?: return null
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    if (h !in 0..23 || m !in 0..59) return null
    return "%02d:%02d".format(h, m)
}

/** Read-only field that opens a 24-hour clock dial; the value is always "HH:mm". */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimeField(value: String, onValueChange: (String) -> Unit, label: String, modifier: Modifier = Modifier) {
    var open by remember { mutableStateOf(false) }
    val interaction = remember { MutableInteractionSource() }
    // A read-only text field swallows clicks, so react to its press events instead
    LaunchedEffect(interaction) {
        interaction.interactions.collect { if (it is PressInteraction.Release) open = true }
    }
    OutlinedTextField(
        value = normalizeTime(value) ?: value,
        onValueChange = {},
        readOnly = true,
        label = { Text(label) },
        trailingIcon = { Icon(Icons.Outlined.Schedule, null) },
        singleLine = true,
        interactionSource = interaction,
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    )
    if (open) {
        val (h, m) = (normalizeTime(value) ?: "08:00").split(":").map { it.toInt() }
        val state = rememberTimePickerState(initialHour = h, initialMinute = m, is24Hour = true)
        AlertDialog(
            onDismissRequest = { open = false },
            title = { Text(label) },
            text = { TimePicker(state = state) },
            confirmButton = {
                TextButton(onClick = { onValueChange("%02d:%02d".format(state.hour, state.minute)); open = false }) { Text(tr("Tanlash")) }
            },
            dismissButton = { TextButton(onClick = { open = false }) { Text(tr("Bekor qilish")) } }
        )
    }
}

/** "O'chirilsinmi?" before every delete. */
@Composable
fun ConfirmDeleteDialog(title: String, text: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { Text(text) },
        confirmButton = {
            TextButton(onClick = onConfirm, colors = ButtonDefaults.textButtonColors(contentColor = SchoolDayTheme.colors.danger)) { Text(tr("O'chirish")) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    )
}

/** For deletes that can't be undone and hit a lot (a school, a user): the name must be typed. */
@Composable
fun TypeToConfirmDialog(title: String, text: String, expected: String, onConfirm: () -> Unit, onDismiss: () -> Unit) {
    var typed by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(text)
                Text(tr("Tasdiqlash uchun yozing: %s", expected), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                SdTextField(typed, { typed = it }, tr("Nomi"))
            }
        },
        confirmButton = {
            TextButton(
                onClick = onConfirm,
                enabled = typed.trim() == expected.trim(),
                colors = ButtonDefaults.textButtonColors(contentColor = SchoolDayTheme.colors.danger)
            ) { Text(tr("O'chirish")) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    )
}

/** Asks for the account password before a security change (2FA, deleting the account). */
@Composable
fun PasswordPromptDialog(
    title: String,
    text: String,
    confirmLabel: String,
    busy: Boolean,
    error: String?,
    onConfirm: (String) -> Unit,
    onDismiss: () -> Unit,
    danger: Boolean = false
) {
    var password by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(text)
                SdTextField(password, { password = it }, tr("Parol"), password = true)
                error?.let { Text(it, color = SchoolDayTheme.colors.danger, style = MaterialTheme.typography.bodyMedium) }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(password) },
                enabled = password.isNotBlank() && !busy,
                colors = if (danger) ButtonDefaults.textButtonColors(contentColor = SchoolDayTheme.colors.danger) else ButtonDefaults.textButtonColors()
            ) { Text(confirmLabel) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    )
}

/** Small uppercase heading inside a form. */
@Composable
fun FormSectionTitle(text: String) {
    Text(
        text.uppercase(),
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier.padding(top = 6.dp, start = 2.dp)
    )
}
