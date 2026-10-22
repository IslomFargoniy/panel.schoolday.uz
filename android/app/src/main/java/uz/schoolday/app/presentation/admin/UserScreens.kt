package uz.schoolday.app.presentation.admin

import android.widget.Toast
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.AdminUserDto
import uz.schoolday.app.data.remote.dto.SchoolDto
import uz.schoolday.app.data.remote.dto.UserBody
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.OnChangedReturn
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.PhoneFormat
import uz.schoolday.app.util.tr
import javax.inject.Inject

/** "Admin" / "Superadmin"; no role = school admin. */
@Composable
fun roleLabel(role: String?): String = when (role) {
    "Superadmin" -> tr("Superadmin")
    "Admin" -> tr("Admin")
    null, "" -> tr("Maktab admini")
    else -> role
}

// ---------------- List ----------------

data class UserListUi(
    val search: String = "",
    val role: String? = null,
    val schoolId: Int? = null,
    val users: List<AdminUserDto> = emptyList(),
    val roles: List<String> = emptyList(),
    val schools: List<SchoolDto> = emptyList(),
    val loaded: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class UserListViewModel @Inject constructor(private val manage: ManageRepository) : ViewModel() {
    private val _ui = MutableStateFlow(UserListUi())
    val ui: StateFlow<UserListUi> = _ui.asStateFlow()
    private var job: Job? = null

    init {
        viewModelScope.launch {
            (manage.roles() as? Resource.Success)?.data?.let { r -> _ui.update { it.copy(roles = r) } }
            (manage.schools(null, null) as? Resource.Success)?.data?.let { s -> _ui.update { it.copy(schools = s) } }
        }
        load()
    }

    fun onSearch(v: String) { _ui.update { it.copy(search = v) }; load(debounce = true) }
    fun onRole(v: String?) { _ui.update { it.copy(role = v) }; load() }
    fun onSchool(v: Int?) { _ui.update { it.copy(schoolId = v) }; load() }

    fun load(debounce: Boolean = false) {
        job?.cancel()
        job = viewModelScope.launch {
            if (debounce) delay(350)
            _ui.update { it.copy(loading = true, error = null) }
            val s = _ui.value
            when (val r = manage.users(s.search, s.role, s.schoolId)) {
                is Resource.Success -> _ui.update { it.copy(loading = false, loaded = true, users = r.data.orEmpty()) }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserListScreen(navController: NavController, viewModel: UserListViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = { SdTopBar(tr("Foydalanuvchilar"), subtitle = tr("%s ta", ui.users.size), onBack = { navController.popBackStack() }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { navController.navigate(Screen.UserForm.createRoute()) }, containerColor = MaterialTheme.colorScheme.primary, shape = RoundedCornerShape(16.dp)) {
                Icon(Icons.Outlined.PersonAdd, tr("Qo'shish"), tint = MaterialTheme.colorScheme.onPrimary)
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.loading, onRefresh = { viewModel.load() }, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    OutlinedTextField(
                        value = ui.search, onValueChange = viewModel::onSearch, placeholder = { Text(tr("Ism, email yoki telefon")) },
                        leadingIcon = { Icon(Icons.Outlined.Search, null) }, singleLine = true, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.horizontalScroll(rememberScrollState())) {
                        DropdownChip(
                            label = ui.role?.let { roleLabel(it) } ?: tr("Barcha rollar"),
                            options = listOf<Pair<String?, String>>(null to tr("Barcha rollar")) + ui.roles.map { it as String? to roleLabel(it) },
                            onSelect = viewModel::onRole,
                            icon = Icons.Outlined.Badge
                        )
                        DropdownChip(
                            label = ui.schools.firstOrNull { it.id == ui.schoolId }?.name ?: tr("Barcha maktablar"),
                            options = listOf<Pair<Int?, String>>(null to tr("Barcha maktablar")) + ui.schools.map { it.id as Int? to it.name },
                            onSelect = viewModel::onSchool,
                            icon = Icons.Outlined.School
                        )
                    }
                }
                ui.error?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.users.isEmpty()) item { EmptyState(tr("Foydalanuvchilar topilmadi"), Icons.Outlined.PersonSearch) }
                items(ui.users, key = { it.id }) { u ->
                    SdCard(onClick = { navController.navigate(Screen.UserForm.createRoute(u.id)) }, padding = PaddingValues(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Avatar(null, u.name, sizeDp = 42)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(u.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(
                                    listOfNotNull(u.email, PhoneFormat.display(u.phone), u.schools.joinToString(", ") { it.name }.ifBlank { null }).joinToString(" · "),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                            StatusPill(roleLabel(u.role), if (u.role.isNullOrBlank()) Tone.Neutral else Tone.Info)
                        }
                    }
                }
            }
        }
    }
}

// ---------------- Form ----------------

data class UserFormUi(
    val isEdit: Boolean = false,
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val password: String = "",
    val role: String = "Admin",
    val roles: List<String> = emptyList(),
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val done: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class UserFormViewModel @Inject constructor(
    private val manage: ManageRepository,
    savedState: SavedStateHandle
) : ViewModel() {
    private val userId: Int? = savedState.get<Int>("userId")?.takeIf { it > 0 }
    private val _ui = MutableStateFlow(UserFormUi(isEdit = userId != null))
    val ui: StateFlow<UserFormUi> = _ui.asStateFlow()

    init {
        viewModelScope.launch {
            _ui.update { it.copy(loading = true) }
            (manage.roles() as? Resource.Success)?.data?.let { r -> _ui.update { it.copy(roles = r) } }
            if (userId != null) {
                // No single-user endpoint: the list has everyone
                when (val r = manage.users(null, null, null)) {
                    is Resource.Success -> r.data.orEmpty().firstOrNull { it.id == userId }?.let { u ->
                        _ui.update { it.copy(name = u.name, email = u.email.orEmpty(), phone = u.phone.orEmpty(), role = u.role ?: it.roles.firstOrNull().orEmpty()) }
                    }
                    is Resource.Error -> _ui.update { it.copy(error = r.message) }
                }
            }
            _ui.update { it.copy(loading = false) }
        }
    }

    fun edit(change: (UserFormUi) -> UserFormUi) = _ui.update { change(it).copy(error = null) }

    fun save() {
        val s = _ui.value
        when {
            s.name.isBlank() || s.email.isBlank() -> return _ui.update { it.copy(error = tr("Ism va email majburiy")) }
            !s.isEdit && s.password.length < 8 -> return _ui.update { it.copy(error = tr("Parol kamida 8 belgi")) }
            s.isEdit && s.password.isNotEmpty() && s.password.length < 8 -> return _ui.update { it.copy(error = tr("Parol kamida 8 belgi")) }
        }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            val body = UserBody(s.name.trim(), s.email.trim(), s.phone.trim().ifBlank { null }, s.password.ifBlank { null }, s.role)
            when (val r = manage.saveUser(userId, body)) {
                is Resource.Success -> _ui.update { it.copy(saving = false, done = true) }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun delete() {
        val id = userId ?: return
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.deleteUser(id)) {
                is Resource.Success -> _ui.update { it.copy(saving = false, done = true, deleted = true) }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }
}

@Composable
fun UserFormScreen(navController: NavController, viewModel: UserFormViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, if (ui.deleted) tr("O'chirildi") else tr("Saqlandi"), Toast.LENGTH_SHORT).show()
            navController.finishForm()
        }
    }
    if (confirmDelete) {
        TypeToConfirmDialog(tr("Foydalanuvchini o'chirish"), tr("Hisob va uning barcha sessiyalari o'chiriladi."), ui.name, { confirmDelete = false; viewModel.delete() }, { confirmDelete = false })
    }

    FormScaffold(
        title = if (ui.isEdit) tr("Foydalanuvchini tahrirlash") else tr("Yangi foydalanuvchi"),
        onBack = { navController.popBackStack() },
        onSave = viewModel::save,
        saving = ui.saving,
        error = ui.error,
        onDelete = if (ui.isEdit) ({ confirmDelete = true }) else null
    ) {
        if (ui.loading) {
            LoadingBox()
            return@FormScaffold
        }
        SdTextField(ui.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("F.I.SH"))
        SdTextField(ui.email, { v -> viewModel.edit { it.copy(email = v) } }, tr("Email"), keyboardType = KeyboardType.Email)
        PhoneField(ui.phone, { v -> viewModel.edit { it.copy(phone = v) } }, tr("Telefon"))
        SdTextField(
            ui.password, { v -> viewModel.edit { it.copy(password = v) } }, tr("Parol"), password = true,
            supporting = if (ui.isEdit) tr("Bo'sh qoldirilsa, parol o'zgarmaydi") else tr("Kamida 8 belgi")
        )
        SelectField(tr("Rol"), ui.role, ui.roles.map { it to roleLabel(it) }, { v -> viewModel.edit { it.copy(role = v) } })
        Text(
            tr("Admin barcha maktablarni boshqaradi. Superadmin bunga qo'shimcha foydalanuvchilar va tizim sozlamalarini boshqaradi."),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

// ---------------- System settings ----------------

data class SystemUi(
    val tokenSet: Boolean = false,
    val tokenMasked: String? = null,
    val token: String = "",
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val message: String? = null
)

@HiltViewModel
class SystemSettingsViewModel @Inject constructor(private val manage: ManageRepository) : ViewModel() {
    private val _ui = MutableStateFlow(SystemUi())
    val ui: StateFlow<SystemUi> = _ui.asStateFlow()

    init {
        viewModelScope.launch {
            _ui.update { it.copy(loading = true) }
            when (val r = manage.systemSettings()) {
                is Resource.Success -> _ui.update { it.copy(loading = false, tokenSet = r.data!!.telegramBotTokenSet, tokenMasked = r.data.telegramBotTokenMasked) }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun onToken(v: String) = _ui.update { it.copy(token = v.trim(), error = null) }

    fun save() {
        val token = _ui.value.token
        if (token.isBlank()) return _ui.update { it.copy(error = tr("Yangi tokenni kiriting")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.saveSystemSettings(token)) {
                is Resource.Success -> _ui.update {
                    it.copy(saving = false, token = "", tokenSet = r.data!!.telegramBotTokenSet, tokenMasked = r.data.telegramBotTokenMasked, message = tr("Saqlandi. Telegram webhook o'rnatildi."))
                }
                // The token is saved even when the webhook step failed: show why
                is Resource.Error -> _ui.update { it.copy(saving = false, token = "", error = r.message) }
            }
        }
    }

    fun onMessageShown() = _ui.update { it.copy(message = null) }
}

@Composable
fun SystemSettingsScreen(navController: NavController, viewModel: SystemSettingsViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val context = LocalContext.current
    val c = SchoolDayTheme.colors
    LaunchedEffect(ui.message) { ui.message?.let { Toast.makeText(context, it, Toast.LENGTH_LONG).show(); viewModel.onMessageShown() } }

    FormScaffold(tr("Tizim sozlamalari"), { navController.popBackStack() }, viewModel::save, ui.saving, ui.error) {
        if (ui.loading) {
            LoadingBox()
            return@FormScaffold
        }
        FormSectionTitle(tr("Telegram bot"))
        SdCard(padding = PaddingValues(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RowIcon(Icons.Outlined.SmartToy, if (ui.tokenSet) c.success else c.warning, if (ui.tokenSet) c.successBg else c.warningBg)
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(if (ui.tokenSet) tr("Token o'rnatilgan") else tr("Token o'rnatilmagan"), style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium))
                    ui.tokenMasked?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
            }
        }
        SdTextField(ui.token, viewModel::onToken, tr("Yangi bot token"), password = true, placeholder = "123456:ABC-DEF...", supporting = tr("Saqlanganda Telegram webhook qayta o'rnatiladi"))
        Text(
            tr("Ota-onalarga kirish-chiqish xabarlari shu bot orqali yuboriladi."),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
