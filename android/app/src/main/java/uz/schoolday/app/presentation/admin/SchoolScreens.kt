package uz.schoolday.app.presentation.admin

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import uz.schoolday.app.data.remote.dto.*
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.OnChangedReturn
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.PhoneFormat
import uz.schoolday.app.util.ThousandsTransformation
import uz.schoolday.app.util.tr
import javax.inject.Inject

// ---------------- List ----------------

data class SchoolListUi(
    val search: String = "",
    val status: Int? = null,
    val schools: List<SchoolDto> = emptyList(),
    val loaded: Boolean = false,
    val loading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class SchoolListViewModel @Inject constructor(private val manage: ManageRepository) : ViewModel() {
    private val _ui = MutableStateFlow(SchoolListUi())
    val ui: StateFlow<SchoolListUi> = _ui.asStateFlow()
    private var job: Job? = null

    init {
        load()
    }

    fun onSearch(v: String) {
        _ui.update { it.copy(search = v) }
        load(debounce = true)
    }

    fun onStatus(v: Int?) {
        _ui.update { it.copy(status = v) }
        load()
    }

    fun load(debounce: Boolean = false) {
        job?.cancel()
        job = viewModelScope.launch {
            if (debounce) delay(350)
            _ui.update { it.copy(loading = true, error = null) }
            when (val r = manage.schools(_ui.value.search, _ui.value.status)) {
                is Resource.Success -> _ui.update { it.copy(loading = false, loaded = true, schools = r.data.orEmpty()) }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SchoolListScreen(navController: NavController, viewModel: SchoolListViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = { SdTopBar(tr("Maktablar"), subtitle = tr("%s ta maktab", ui.schools.size), onBack = { navController.popBackStack() }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { navController.navigate(Screen.SchoolForm.createRoute()) }, containerColor = MaterialTheme.colorScheme.primary, shape = RoundedCornerShape(16.dp)) {
                Icon(Icons.Outlined.Add, tr("Qo'shish"), tint = MaterialTheme.colorScheme.onPrimary)
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
                        value = ui.search, onValueChange = viewModel::onSearch, placeholder = { Text(tr("Nomi, manzil yoki izoh...")) },
                        leadingIcon = { Icon(Icons.Outlined.Search, null) }, singleLine = true, shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth()
                    )
                }
                item {
                    DropdownChip(
                        label = when (ui.status) { 1 -> tr("Faol"); 0 -> tr("Faol emas"); else -> tr("Barcha holatlar") },
                        options = listOf<Pair<Int?, String>>(null to tr("Barcha holatlar"), 1 to tr("Faol"), 0 to tr("Faol emas")),
                        onSelect = viewModel::onStatus,
                        icon = Icons.Outlined.FilterList
                    )
                }
                ui.error?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.schools.isEmpty()) item { EmptyState(tr("Maktablar topilmadi"), Icons.Outlined.School) }
                items(ui.schools, key = { it.id }) { s -> SchoolRow(s) { navController.navigate(Screen.SchoolForm.createRoute(s.id)) } }
            }
        }
    }
}

@Composable
private fun SchoolRow(s: SchoolDto, onClick: () -> Unit) {
    val c = SchoolDayTheme.colors
    val expired = s.validDate != null && s.validDate < DateUtils.today()
    SdCard(onClick = onClick, padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            RowIcon(Icons.Outlined.School, c.accentText, c.indigoBg, size = 42)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(s.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(
                        tr("%s / %s filial", s.branchesCount, s.branchLimit ?: "∞"),
                        s.validDate?.let { tr("%s gacha", DateUtils.formatDisplayDate(it)) }
                    ).joinToString(" · "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (expired) c.danger else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            when {
                s.status != 1 -> StatusPill(tr("Faol emas"), Tone.Danger)
                expired -> StatusPill(tr("Muddati tugagan"), Tone.Warning)
                else -> StatusPill(tr("Faol"), Tone.Success)
            }
        }
    }
}

// ---------------- Create / edit (+ settings and users) ----------------

data class SchoolFormUi(
    val isEdit: Boolean = false,
    val name: String = "",
    val address: String = "",
    val comment: String = "",
    val branchLimit: String = "1",
    val branchPrice: String = "",
    val validDate: String = "",
    val active: Boolean = true,
    val settings: SchoolSettingsDto = SchoolSettingsDto(),
    val users: List<UserBrief> = emptyList(),
    val loading: Boolean = false,
    val saving: Boolean = false,
    val savingSettings: Boolean = false,
    val error: String? = null,
    val message: String? = null,
    val done: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class SchoolFormViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore,
    savedState: SavedStateHandle
) : ViewModel() {
    private val schoolId: Int? = savedState.get<Int>("schoolId")?.takeIf { it > 0 }
    private val _ui = MutableStateFlow(SchoolFormUi(isEdit = schoolId != null))
    val ui: StateFlow<SchoolFormUi> = _ui.asStateFlow()

    init {
        schoolId?.let { id ->
            viewModelScope.launch {
                _ui.update { it.copy(loading = true) }
                when (val r = manage.school(id)) {
                    is Resource.Success -> apply(r.data!!)
                    is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
                }
            }
        }
    }

    private fun apply(s: SchoolDto) = _ui.update {
        it.copy(
            loading = false, name = s.name, address = s.address.orEmpty(), comment = s.comment.orEmpty(),
            branchLimit = s.branchLimit?.toString() ?: "", branchPrice = s.branchPrice?.toLong()?.toString() ?: "",
            validDate = s.validDate.orEmpty(), active = s.status == 1, settings = s.settings, users = s.users
        )
    }

    fun edit(change: (SchoolFormUi) -> SchoolFormUi) = _ui.update { change(it).copy(error = null) }

    fun save() {
        val s = _ui.value
        if (s.name.isBlank()) return _ui.update { it.copy(error = tr("Maktab nomini kiriting")) }
        val limit = s.branchLimit.toIntOrNull()?.takeIf { it >= 1 } ?: return _ui.update { it.copy(error = tr("Filial limiti kamida 1")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            val body = SchoolBody(
                s.name.trim(), s.address.trim().ifBlank { null }, s.comment.trim().ifBlank { null }, limit,
                s.branchPrice.replace(" ", "").toDoubleOrNull(), s.validDate.ifBlank { null }, if (s.active) 1 else 0
            )
            when (val r = manage.saveSchool(schoolId, body)) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(saving = false, done = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun saveSettings() {
        val id = schoolId ?: return
        val st = _ui.value.settings
        viewModelScope.launch {
            _ui.update { it.copy(savingSettings = true) }
            val body = SchoolSettingsBody(id, st.telegramChannelId?.trim()?.ifBlank { null }, st.timezone, st.smsSender?.trim()?.ifBlank { null }, st.webhookUrl?.trim()?.ifBlank { null })
            when (val r = manage.saveSchoolSettings(id, body)) {
                is Resource.Success -> { apply(r.data!!); _ui.update { it.copy(savingSettings = false, message = tr("Sozlamalar saqlandi")) } }
                is Resource.Error -> _ui.update { it.copy(savingSettings = false, error = r.message) }
            }
        }
    }

    fun attach(user: UserBrief) = change { manage.attachUser(schoolId!!, user.id) }

    fun detach(user: UserBrief) = change { manage.detachUser(schoolId!!, user.id) }

    private fun change(call: suspend () -> Resource<SchoolDto>) {
        viewModelScope.launch {
            when (val r = call()) {
                is Resource.Success -> apply(r.data!!)
                is Resource.Error -> _ui.update { it.copy(error = r.message) }
            }
        }
    }

    suspend fun lookup(q: String): List<UserBrief> = (manage.lookupUsers(q) as? Resource.Success)?.data.orEmpty()

    fun delete() {
        val id = schoolId ?: return
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.deleteSchool(id)) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(saving = false, done = true, deleted = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun onMessageShown() = _ui.update { it.copy(message = null) }
}

private val TIMEZONES = listOf("Asia/Tashkent", "Asia/Samarkand", "Asia/Almaty", "Asia/Bishkek", "Asia/Dushanbe", "Europe/Moscow", "UTC")

@Composable
fun SchoolFormScreen(navController: NavController, viewModel: SchoolFormViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val context = LocalContext.current
    val c = SchoolDayTheme.colors
    var confirmDelete by remember { mutableStateOf(false) }
    var addUser by remember { mutableStateOf(false) }
    var removing by remember { mutableStateOf<UserBrief?>(null) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, if (ui.deleted) tr("O'chirildi") else tr("Saqlandi"), Toast.LENGTH_SHORT).show()
            navController.finishForm()
        }
    }
    LaunchedEffect(ui.message) { ui.message?.let { Toast.makeText(context, it, Toast.LENGTH_SHORT).show(); viewModel.onMessageShown() } }

    if (confirmDelete) {
        TypeToConfirmDialog(
            tr("Maktabni o'chirish"),
            tr("Filiali yoki o'quvchisi bor maktabni o'chirib bo'lmaydi. Biriktirilgan foydalanuvchilar va sozlamalar ham o'chadi."),
            ui.name,
            { confirmDelete = false; viewModel.delete() },
            { confirmDelete = false }
        )
    }
    removing?.let { u ->
        ConfirmDeleteDialog(tr("Foydalanuvchini ajratish"), tr("%s bu maktabni boshqara olmay qoladi.", u.name), { removing = null; viewModel.detach(u) }, { removing = null })
    }
    if (addUser) {
        UserLookupDialog(viewModel::lookup, onPick = { addUser = false; viewModel.attach(it) }, onDismiss = { addUser = false })
    }

    FormScaffold(
        title = if (ui.isEdit) ui.name.ifBlank { tr("Maktab") } else tr("Yangi maktab"),
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
        FormSectionTitle(tr("Maktab"))
        SdTextField(ui.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("Nomi"))
        SdTextField(ui.address, { v -> viewModel.edit { it.copy(address = v) } }, tr("Manzil"))
        SdTextField(ui.comment, { v -> viewModel.edit { it.copy(comment = v) } }, tr("Izoh"), singleLine = false, minLines = 2)

        FormSectionTitle(tr("Obuna"))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            SdTextField(ui.branchLimit, { v -> viewModel.edit { it.copy(branchLimit = v.filter(Char::isDigit)) } }, tr("Filial limiti"), Modifier.weight(1f), keyboardType = KeyboardType.Number)
            SdTextField(
                ui.branchPrice, { v -> viewModel.edit { it.copy(branchPrice = v.filter(Char::isDigit).take(12)) } }, tr("Filial narxi (so'm)"),
                Modifier.weight(1f), keyboardType = KeyboardType.Number, visualTransformation = ThousandsTransformation
            )
        }
        DateField(ui.validDate.ifBlank { DateUtils.today() }, { v -> viewModel.edit { it.copy(validDate = v) } }, tr("Amal qilish muddati"), Modifier.fillMaxWidth(), maxToday = false)
        SwitchRow(tr("Faol"), ui.active, { v -> viewModel.edit { it.copy(active = v) } }, tr("Faol bo'lmagan maktab adminlari tizimga kira olmaydi"))

        if (ui.isEdit) {
            FormSectionTitle(tr("Sozlamalar"))
            SdCard(padding = PaddingValues(14.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    SdTextField(ui.settings.telegramChannelId.orEmpty(), { v -> viewModel.edit { it.copy(settings = it.settings.copy(telegramChannelId = v)) } }, tr("Telegram kanal ID"))
                    SelectField(tr("Vaqt zonasi"), ui.settings.timezone, TIMEZONES.map { it as String? to it }, { v -> viewModel.edit { it.copy(settings = it.settings.copy(timezone = v)) } })
                    SdTextField(ui.settings.smsSender.orEmpty(), { v -> viewModel.edit { it.copy(settings = it.settings.copy(smsSender = v)) } }, tr("SMS jo'natuvchi"))
                    SdTextField(ui.settings.webhookUrl.orEmpty(), { v -> viewModel.edit { it.copy(settings = it.settings.copy(webhookUrl = v)) } }, tr("Webhook URL"), keyboardType = KeyboardType.Uri)
                    FilledTonalButton(onClick = viewModel::saveSettings, enabled = !ui.savingSettings, modifier = Modifier.fillMaxWidth()) {
                        Text(if (ui.savingSettings) tr("Saqlanmoqda...") else tr("Sozlamalarni saqlash"))
                    }
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                FormSectionTitle(tr("Foydalanuvchilar"))
                Spacer(Modifier.weight(1f))
                TextButton(onClick = { addUser = true }) { Icon(Icons.Outlined.PersonAdd, null, Modifier.size(18.dp)); Spacer(Modifier.width(4.dp)); Text(tr("Biriktirish")) }
            }
            if (ui.users.isEmpty()) {
                Text(tr("Biriktirilgan foydalanuvchi yo'q"), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                SdCard {
                    ui.users.forEachIndexed { i, u ->
                        if (i > 0) RowDivider()
                        Row(Modifier.fillMaxWidth().padding(start = 14.dp, top = 6.dp, bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                            Avatar(null, u.name, sizeDp = 36)
                            Spacer(Modifier.width(10.dp))
                            Column(Modifier.weight(1f)) {
                                Text(u.name, style = MaterialTheme.typography.bodyLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(listOfNotNull(u.email, PhoneFormat.display(u.phone)).joinToString(" · "), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                            }
                            IconButton(onClick = { removing = u }) { Icon(Icons.Outlined.PersonRemove, tr("Ajratish"), tint = c.danger) }
                        }
                    }
                }
            }
        }
    }
}

/** Find a user by name, email or phone (at least 2 letters). */
@Composable
fun UserLookupDialog(lookup: suspend (String) -> List<UserBrief>, onPick: (UserBrief) -> Unit, onDismiss: () -> Unit) {
    var text by remember { mutableStateOf("") }
    var results by remember { mutableStateOf(emptyList<UserBrief>()) }
    LaunchedEffect(text) {
        if (text.length < 2) { results = emptyList(); return@LaunchedEffect }
        delay(300)
        results = lookup(text)
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(tr("Foydalanuvchini biriktirish")) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SdTextField(text, { text = it }, tr("Ism, email yoki telefon"))
                if (text.length >= 2 && results.isEmpty()) {
                    Text(tr("Topilmadi. Yangi foydalanuvchini Superadmin qo'shadi."), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Column(Modifier.heightIn(max = 300.dp)) {
                    results.forEach { u ->
                        Row(Modifier.fillMaxWidth().clickable { onPick(u) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                            Avatar(null, u.name, sizeDp = 34)
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(u.name, style = MaterialTheme.typography.bodyLarge)
                                Text(listOfNotNull(u.email, PhoneFormat.display(u.phone)).joinToString(" · "), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    )
}
