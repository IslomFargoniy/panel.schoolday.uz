package uz.schoolday.app.presentation.devices

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.schoolday.app.data.remote.dto.DeviceConnectionDto
import uz.schoolday.app.data.remote.dto.DeviceDto
import uz.schoolday.app.util.tr

/** One device: what to type into the terminal for it (Device ID, key, server IP and domain), each with a copy button. */
@Composable
fun DeviceInfoDialog(d: DeviceDto, connection: DeviceConnectionDto?, onEdit: () -> Unit, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val isup = d.connectionType == "isup"
    val rows = buildList {
        if (isup) {
            d.deviceId?.takeIf { it.isNotBlank() }?.let { add("Device ID" to it) }
            d.encryptionKey?.takeIf { it.isNotBlank() }?.let { add("Encryption Key" to it) }
            connection?.serverIp?.takeIf { it.isNotBlank() }?.let { add("Server IP" to it) }
            connection?.serverDomain?.takeIf { it.isNotBlank() }?.let { add(tr("yoki Domain") to it) }
            connection?.isupPort?.let { add("Port" to it.toString()) }
        }
        d.macAddress?.takeIf { it.isNotBlank() }?.let { add("MAC" to it) }
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(d.name ?: d.deviceId ?: tr("Qurilma"))
                Text(
                    if (isup) "ISUP 5.0" else "HTTP Listening",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                rows.forEach { (label, value) ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            label,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.width(110.dp)
                        )
                        Text(
                            value,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold, fontFamily = FontFamily.Monospace),
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { copy(context, label, value) }, modifier = Modifier.size(36.dp)) {
                            Icon(Icons.Outlined.ContentCopy, tr("Nusxalash"), modifier = Modifier.size(18.dp))
                        }
                    }
                }
                if (isup) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        tr("Terminalda: Network → Platform Access → ISUP 5.0. Address Type: IP Address yoki Domain Name."),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text(tr("Yopish")) } },
        dismissButton = { TextButton(onClick = onEdit) { Text(tr("Tahrirlash")) } }
    )
}

private fun copy(context: Context, label: String, value: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    clipboard.setPrimaryClip(ClipData.newPlainText(label, value))
    Toast.makeText(context, tr("Nusxalandi"), Toast.LENGTH_SHORT).show()
}
