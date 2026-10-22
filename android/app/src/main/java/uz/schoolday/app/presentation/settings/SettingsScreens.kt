package uz.schoolday.app.presentation.settings

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.Logout
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import uz.schoolday.app.BuildConfig
import uz.schoolday.app.presentation.auth.PinSetupDialog
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.BottomBarContentPadding
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.BiometricHelper
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.findFragmentActivity
import uz.schoolday.app.util.initials
import uz.schoolday.app.util.PhoneFormat
import uz.schoolday.app.util.tr

@Composable
fun SettingsScreen(navController: NavController, viewModel: SettingsViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val c = SchoolDayTheme.colors
    val context = LocalContext.current
    var showLogout by remember { mutableStateOf(false) }
    var pinSetup by remember { mutableStateOf(false) }
    var deleteAccount by remember { mutableStateOf(false) }
    val deleteVm: uz.schoolday.app.presentation.account.DeleteAccountViewModel = hiltViewModel()
    val deleting by deleteVm.busy.collectAsState()
    val deleteError by deleteVm.error.collectAsState()

    if (deleteAccount) {
        PasswordPromptDialog(
            title = tr("Hisobni o'chirish"),
            text = tr("Hisobingiz butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi."),
            confirmLabel = tr("O'chirish"),
            busy = deleting,
            error = deleteError,
            onConfirm = deleteVm::delete,
            onDismiss = { deleteAccount = false },
            danger = true
        )
    }

    if (pinSetup) {
        PinSetupDialog(onDismiss = { pinSetup = false }, onSet = { pin -> viewModel.enableBiometric(pin); pinSetup = false })
    }
    if (showLogout) {
        AlertDialog(
            onDismissRequest = { showLogout = false },
            title = { Text(tr("Tizimdan chiqish")) },
            text = { Text(tr("Haqiqatan ham SchoolDay tizimidan chiqmoqchimisiz?")) },
            confirmButton = {
                TextButton(onClick = { showLogout = false; viewModel.logout() }, colors = ButtonDefaults.textButtonColors(contentColor = c.danger)) {
                    Text(tr("Chiqish"))
                }
            },
            dismissButton = { TextButton(onClick = { showLogout = false }) { Text(tr("Bekor qilish")) } }
        )
    }

    LaunchedEffect(Unit) { viewModel.loadUser() }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background).statusBarsPadding(),
        contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 16.dp, bottom = BottomBarContentPadding),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { SdHeader(title = tr("Profil")) }

        item {
            val user = ui.user
            val name = user?.name ?: tr("Foydalanuvchi")
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, c.border, RoundedCornerShape(22.dp))
                    .clickable { navController.navigate(Screen.ProfileEdit.route) }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier.size(54.dp).clip(CircleShape).background(c.surface2).border(1.dp, c.borderStrong, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(initials(name), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = c.accentText)
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(
                        listOfNotNull(PhoneFormat.display(user?.phone), user?.email).joinToString(" · ").ifBlank { "-" },
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                if (user?.isGlobalAdmin == true) StatusPill(tr("Admin"), Tone.Info)
                Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        // The schools this account manages, with their subscription state
        val schools = ui.user?.schools.orEmpty()
        if (schools.isNotEmpty()) {
            item { SectionTitle(tr("Maktablar")) }
            item {
                SettingsGroup {
                    schools.forEachIndexed { i, s ->
                        if (i > 0) RowDivider()
                        Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                            RowIcon(Icons.Outlined.School, c.accentText, c.indigoBg)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(s.name, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                s.validDate?.let {
                                    Text(tr("%s gacha", DateUtils.formatDisplayDate(it)), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                            if (s.isActive) StatusPill(tr("Faol"), Tone.Success) else StatusPill(tr("Faol emas"), Tone.Danger)
                        }
                    }
                }
            }
        }

        item { SectionTitle(tr("Hisob")) }
        item {
            SettingsGroup {
                SettingsRowItem(
                    icon = Icons.Outlined.LockReset,
                    title = tr("Parolni o'zgartirish"),
                    iconTint = c.accentText,
                    iconBg = c.indigoBg,
                    onClick = { navController.navigate(Screen.ChangePassword.route) }
                )
                RowDivider()
                SettingsRowItem(
                    icon = Icons.Outlined.Security,
                    title = tr("Ikki bosqichli tasdiqlash"),
                    iconTint = if (ui.user?.twoFactorEnabled == true) c.success else MaterialTheme.colorScheme.onSurfaceVariant,
                    iconBg = if (ui.user?.twoFactorEnabled == true) c.successBg else c.surface2,
                    onClick = { navController.navigate(Screen.TwoFactor.route) }
                )
                RowDivider()
                SettingsRowItem(icon = Icons.Outlined.Router, title = tr("Qurilmalar"), onClick = { navController.navigate(Screen.Devices.route) })
            }
        }

        item { SectionTitle(tr("Ilova")) }
        item {
            SettingsGroup {
                SettingsRow(icon = Icons.Outlined.Language, title = tr("Til")) {
                    SegmentedChoice(listOf("uz" to "UZ", "ru" to "RU", "en" to "EN"), ui.language, viewModel::setLanguage)
                }
                RowDivider()
                Column(Modifier.padding(start = 14.dp, end = 14.dp, top = 12.dp, bottom = 14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RowIcon(Icons.Outlined.DarkMode, MaterialTheme.colorScheme.onSurfaceVariant, c.surface2)
                        Spacer(Modifier.width(12.dp))
                        Text(tr("Mavzu"), style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium))
                    }
                    Spacer(Modifier.height(12.dp))
                    SegmentedChoice(
                        listOf("system" to tr("Tizim"), "light" to tr("Yorug'"), "dark" to tr("Qorong'i")),
                        ui.themeMode,
                        viewModel::setThemeMode,
                        modifier = Modifier.fillMaxWidth(),
                        fillWidth = true
                    )
                }
                RowDivider()
                SettingsRow(icon = Icons.Outlined.Fingerprint, title = tr("Barmoq izi yoki yuz bilan kirish")) {
                    Switch(
                        checked = ui.isBiometricEnabled,
                        onCheckedChange = { enable ->
                            if (!enable) {
                                viewModel.disableBiometric()
                                return@Switch
                            }
                            val reason = BiometricHelper.unavailableReason(context)
                            val activity = context.findFragmentActivity()
                            if (reason != null || activity == null) {
                                Toast.makeText(context, reason ?: tr("Biometrik kirish ishlamaydi"), Toast.LENGTH_LONG).show()
                                return@Switch
                            }
                            // Turn it on only after the user proves the sensor works for them, then a PIN is required
                            BiometricHelper.authenticate(
                                activity = activity,
                                title = tr("Biometrik kirishni yoqish"),
                                subtitle = tr("Tasdiqlash uchun barmoq izi yoki yuzingizni tasdiqlang"),
                                negativeText = tr("Bekor qilish"),
                                onSuccess = { pinSetup = true },
                                onFailure = { message -> if (message != null) Toast.makeText(context, message, Toast.LENGTH_LONG).show() }
                            )
                        }
                    )
                }
            }
        }

        item {
            Spacer(Modifier.height(4.dp))
            SettingsGroup {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { showLogout = true }.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RowIcon(Icons.AutoMirrored.Outlined.Logout, c.danger, c.dangerBg)
                    Spacer(Modifier.width(12.dp))
                    Text(tr("Tizimdan chiqish"), style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), color = c.danger)
                }
                RowDivider()
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { deleteAccount = true }.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RowIcon(Icons.Outlined.PersonRemove, c.danger, c.dangerBg)
                    Spacer(Modifier.width(12.dp))
                    Text(tr("Hisobni o'chirish"), style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), color = c.danger)
                }
            }
        }

        item {
            Text(
                "SchoolDay ${BuildConfig.VERSION_NAME}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}

@Composable
private fun SettingsGroup(content: @Composable ColumnScope.() -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, SchoolDayTheme.colors.border, RoundedCornerShape(20.dp)),
        content = content
    )
}

/** Icon + title row with a trailing control (switch, segmented choice). */
@Composable
private fun SettingsRow(icon: ImageVector, title: String, trailing: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        RowIcon(icon, MaterialTheme.colorScheme.onSurfaceVariant, SchoolDayTheme.colors.surface2)
        Spacer(Modifier.width(12.dp))
        Text(title, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), modifier = Modifier.weight(1f))
        trailing()
    }
}

@Composable
private fun SettingsRowItem(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit,
    iconTint: Color = MaterialTheme.colorScheme.onSurfaceVariant,
    iconBg: Color = SchoolDayTheme.colors.surface2
) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RowIcon(icon, iconTint, iconBg)
        Spacer(Modifier.width(12.dp))
        Text(title, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), modifier = Modifier.weight(1f))
        Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun SegmentedChoice(
    options: List<Pair<String, String>>,
    selected: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
    fillWidth: Boolean = false
) {
    Row(
        modifier = modifier.clip(RoundedCornerShape(12.dp)).background(SchoolDayTheme.colors.surface2).padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        options.forEach { (value, label) ->
            val on = value == selected
            Box(
                modifier = Modifier
                    .then(if (fillWidth) Modifier.weight(1f) else Modifier)
                    .clip(RoundedCornerShape(9.dp))
                    .background(if (on) MaterialTheme.colorScheme.primary else Color.Transparent)
                    .clickable { onSelect(value) }
                    .padding(horizontal = 12.dp, vertical = 7.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    label,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = if (on) FontWeight.SemiBold else FontWeight.Medium),
                    color = if (on) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun ChangePasswordScreen(navController: NavController, viewModel: SettingsViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var current by remember { mutableStateOf("") }
    var new by remember { mutableStateOf("") }
    var confirm by remember { mutableStateOf("") }

    LaunchedEffect(ui.passwordChanged) {
        if (ui.passwordChanged) {
            Toast.makeText(context, tr("Parol o'zgartirildi"), Toast.LENGTH_SHORT).show()
            navController.popBackStack()
        }
    }

    Scaffold(
        topBar = { SdTopBar(title = tr("Parolni o'zgartirish"), onBack = { navController.popBackStack() }) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            ui.errorMessage?.let { ErrorBanner(it) }
            PasswordField(current, { current = it }, tr("Joriy parol"))
            PasswordField(new, { new = it }, tr("Yangi parol"))
            PasswordField(confirm, { confirm = it }, tr("Yangi parolni takrorlang"))
            Spacer(Modifier.height(6.dp))
            Button(
                onClick = { viewModel.changePassword(current, new, confirm) },
                enabled = !ui.isLoading,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (ui.isLoading) CircularProgressIndicator(Modifier.size(22.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                else Text(tr("Parolni yangilash"), fontWeight = FontWeight.Bold)
            }
            Text(
                tr("Boshqa qurilmalardagi sessiyalar yopiladi."),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun PasswordField(value: String, onChange: (String) -> Unit, label: String) {
    OutlinedTextField(
        value = value,
        onValueChange = onChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    )
}
