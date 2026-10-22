package uz.schoolday.app.presentation.account

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.local.SessionStore
import uz.schoolday.app.data.remote.dto.TwoFactorSetup
import uz.schoolday.app.data.repository.AuthRepository
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.tr
import javax.inject.Inject

// ---------------- Profile edit ----------------

data class ProfileUi(
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val saving: Boolean = false,
    val error: String? = null,
    val done: Boolean = false
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val manage: ManageRepository
) : ViewModel() {
    private val _ui = MutableStateFlow(ProfileUi())
    val ui: StateFlow<ProfileUi> = _ui.asStateFlow()

    init {
        auth.user.value?.let { u -> _ui.update { it.copy(name = u.name, email = u.email.orEmpty(), phone = u.phone.orEmpty()) } }
    }

    fun edit(change: (ProfileUi) -> ProfileUi) = _ui.update { change(it).copy(error = null) }

    fun save() {
        val s = _ui.value
        if (s.name.isBlank() || s.email.isBlank()) return _ui.update { it.copy(error = tr("Ism va email majburiy")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.updateProfile(s.name.trim(), s.email.trim(), s.phone.trim().ifBlank { null })) {
                is Resource.Success -> { auth.me(); _ui.update { it.copy(saving = false, done = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }
}

@Composable
fun ProfileEditScreen(navController: NavController, viewModel: ProfileViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val context = LocalContext.current
    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, tr("Saqlandi"), Toast.LENGTH_SHORT).show()
            navController.popBackStack()
        }
    }
    FormScaffold(tr("Profilni tahrirlash"), { navController.popBackStack() }, viewModel::save, ui.saving, ui.error) {
        SdTextField(ui.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("F.I.SH"))
        SdTextField(ui.email, { v -> viewModel.edit { it.copy(email = v) } }, tr("Email"), keyboardType = KeyboardType.Email)
        PhoneField(ui.phone, { v -> viewModel.edit { it.copy(phone = v) } }, tr("Telefon"))
        Text(tr("Email yoki telefon bilan tizimga kirasiz."), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

// ---------------- Two-factor ----------------

data class TwoFactorUi(
    val enabled: Boolean = false,
    /** Enabling, step 2: the secret to add to the authenticator app. */
    val setup: TwoFactorSetup? = null,
    val code: String = "",
    val recoveryCodes: List<String>? = null,
    /** Which password prompt is open: "enable", "disable", "codes", "regenerate". */
    val prompt: String? = null,
    val busy: Boolean = false,
    val promptError: String? = null,
    val error: String? = null
)

@HiltViewModel
class TwoFactorViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val manage: ManageRepository
) : ViewModel() {
    private val _ui = MutableStateFlow(TwoFactorUi(enabled = auth.user.value?.twoFactorEnabled == true))
    val ui: StateFlow<TwoFactorUi> = _ui.asStateFlow()

    fun ask(prompt: String?) = _ui.update { it.copy(prompt = prompt, promptError = null) }

    fun onPassword(password: String) {
        val prompt = _ui.value.prompt ?: return
        viewModelScope.launch {
            _ui.update { it.copy(busy = true, promptError = null) }
            when (prompt) {
                "enable" -> when (val r = manage.enableTwoFactor(password)) {
                    is Resource.Success -> _ui.update { it.copy(busy = false, prompt = null, setup = r.data, code = "") }
                    is Resource.Error -> _ui.update { it.copy(busy = false, promptError = r.message) }
                }
                "disable" -> when (val r = manage.disableTwoFactor(password)) {
                    is Resource.Success -> { auth.me(); _ui.update { it.copy(busy = false, prompt = null, enabled = false, recoveryCodes = null) } }
                    is Resource.Error -> _ui.update { it.copy(busy = false, promptError = r.message) }
                }
                "codes", "regenerate" -> {
                    val r = if (prompt == "codes") manage.recoveryCodes(password) else manage.regenerateRecoveryCodes(password)
                    when (r) {
                        is Resource.Success -> _ui.update { it.copy(busy = false, prompt = null, recoveryCodes = r.data?.recoveryCodes) }
                        is Resource.Error -> _ui.update { it.copy(busy = false, promptError = r.message) }
                    }
                }
            }
        }
    }

    fun onCode(v: String) = _ui.update { it.copy(code = v.filter(Char::isDigit).take(6), error = null) }

    fun confirm() {
        viewModelScope.launch {
            _ui.update { it.copy(busy = true, error = null) }
            when (val r = manage.confirmTwoFactor(_ui.value.code)) {
                is Resource.Success -> {
                    auth.me()
                    _ui.update { it.copy(busy = false, enabled = true, setup = null, recoveryCodes = r.data?.recoveryCodes) }
                }
                is Resource.Error -> _ui.update { it.copy(busy = false, error = r.message) }
            }
        }
    }

    fun cancelSetup() = _ui.update { it.copy(setup = null, code = "") }
}

private fun copy(context: Context, text: String) {
    (context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager).setPrimaryClip(ClipData.newPlainText("SchoolDay", text))
    Toast.makeText(context, tr("Nusxa olindi"), Toast.LENGTH_SHORT).show()
}

@Composable
fun TwoFactorScreen(navController: NavController, viewModel: TwoFactorViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val context = LocalContext.current
    val c = SchoolDayTheme.colors

    ui.prompt?.let { p ->
        PasswordPromptDialog(
            title = when (p) {
                "enable" -> tr("2FA'ni yoqish")
                "disable" -> tr("2FA'ni o'chirish")
                "regenerate" -> tr("Yangi zaxira kodlar")
                else -> tr("Zaxira kodlar")
            },
            text = tr("Davom etish uchun parolingizni kiriting."),
            confirmLabel = tr("Davom etish"),
            busy = ui.busy,
            error = ui.promptError,
            onConfirm = viewModel::onPassword,
            onDismiss = { viewModel.ask(null) },
            danger = p == "disable"
        )
    }

    Scaffold(
        topBar = { SdTopBar(tr("Ikki bosqichli tasdiqlash"), onBack = { navController.popBackStack() }) },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                SdCard(padding = PaddingValues(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        RowIcon(Icons.Outlined.Security, if (ui.enabled) c.success else c.warning, if (ui.enabled) c.successBg else c.warningBg, size = 44)
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(if (ui.enabled) tr("Yoqilgan") else tr("O'chirilgan"), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            Text(
                                tr("Kirishda paroldan tashqari autentifikator ilovasidagi kod so'raladi."),
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            val setup = ui.setup
            if (setup != null) {
                item { SectionTitle(tr("1. Kalitni autentifikatorga qo'shing")) }
                item {
                    SdCard(padding = PaddingValues(16.dp)) {
                        Button(
                            onClick = {
                                try {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(setup.otpauthUrl)))
                                } catch (e: Exception) {
                                    Toast.makeText(context, tr("Autentifikator ilovasi topilmadi. Kalitni qo'lda kiriting."), Toast.LENGTH_LONG).show()
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) { Text(tr("Autentifikator ilovasida ochish")) }
                        Spacer(Modifier.height(12.dp))
                        Text(tr("Yoki kalitni qo'lda kiriting:"), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            SelectionContainer(Modifier.weight(1f)) {
                                Text(setup.secret.chunked(4).joinToString(" "), fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.titleMedium)
                            }
                            IconButton(onClick = { copy(context, setup.secret) }) { Icon(Icons.Outlined.ContentCopy, tr("Nusxa olish")) }
                        }
                    }
                }
                item { SectionTitle(tr("2. Ilovadagi 6 xonali kodni kiriting")) }
                item { SdTextField(ui.code, viewModel::onCode, tr("Tasdiqlash kodi"), keyboardType = KeyboardType.NumberPassword) }
                ui.error?.let { item { ErrorBanner(it) } }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(onClick = viewModel::cancelSetup, modifier = Modifier.weight(1f)) { Text(tr("Bekor qilish")) }
                        Button(onClick = viewModel::confirm, enabled = ui.code.length == 6 && !ui.busy, modifier = Modifier.weight(1f)) { Text(tr("Tasdiqlash")) }
                    }
                }
            } else if (!ui.enabled) {
                item { Button(onClick = { viewModel.ask("enable") }, modifier = Modifier.fillMaxWidth().height(50.dp)) { Text(tr("2FA'ni yoqish")) } }
            } else {
                item {
                    SdCard {
                        ActionRow(Icons.Outlined.Key, tr("Zaxira kodlarni ko'rish")) { viewModel.ask("codes") }
                        RowDivider()
                        ActionRow(Icons.Outlined.Refresh, tr("Yangi zaxira kodlar yaratish")) { viewModel.ask("regenerate") }
                        RowDivider()
                        ActionRow(Icons.Outlined.LockOpen, tr("2FA'ni o'chirish"), danger = true) { viewModel.ask("disable") }
                    }
                }
            }

            ui.recoveryCodes?.let { codes ->
                item { SectionTitle(tr("Zaxira kodlar")) }
                item {
                    SdCard(padding = PaddingValues(16.dp)) {
                        Text(
                            tr("Telefon yo'qolsa, shu kodlardan biri bilan kirasiz. Har bir kod bir marta ishlaydi. Xavfsiz joyda saqlang."),
                            style = MaterialTheme.typography.bodyMedium,
                            color = c.warning
                        )
                        Spacer(Modifier.height(10.dp))
                        SelectionContainer {
                            Column { codes.forEach { Text(it, fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodyLarge) } }
                        }
                        Spacer(Modifier.height(10.dp))
                        OutlinedButton(onClick = { copy(context, codes.joinToString("\n")) }, modifier = Modifier.fillMaxWidth()) {
                            Icon(Icons.Outlined.ContentCopy, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text(tr("Nusxa olish"))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, danger: Boolean = false, onClick: () -> Unit) {
    val c = SchoolDayTheme.colors
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        TextButton(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.textButtonColors(contentColor = if (danger) c.danger else MaterialTheme.colorScheme.onSurface)) {
            Icon(icon, null, Modifier.size(20.dp))
            Spacer(Modifier.width(10.dp))
            Text(title, modifier = Modifier.weight(1f))
        }
    }
}

// ---------------- Delete account ----------------

@HiltViewModel
class DeleteAccountViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val session: SessionStore,
    private val auth: AuthRepository
) : ViewModel() {
    val busy = MutableStateFlow(false)
    val error = MutableStateFlow<String?>(null)

    /** On success the session is cleared and the app shows the login screen. */
    fun delete(password: String) {
        viewModelScope.launch {
            busy.value = true
            error.value = null
            when (val r = manage.deleteProfile(password)) {
                is Resource.Success -> { session.clearSession(); auth.clearUser() }
                is Resource.Error -> error.value = r.message
            }
            busy.value = false
        }
    }
}
