package uz.schoolday.app.presentation.structure

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.BranchBody
import uz.schoolday.app.data.remote.dto.BranchDto
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.OnChangedReturn
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr
import javax.inject.Inject

// ---------------- List ----------------

data class BranchListUi(val branches: List<BranchDto> = emptyList(), val loaded: Boolean = false, val loading: Boolean = false, val error: String? = null)

@HiltViewModel
class BranchListViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {
    private val _ui = MutableStateFlow(BranchListUi())
    val ui: StateFlow<BranchListUi> = _ui.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch { scopeStore.scope.map { it.schoolId }.distinctUntilChanged().collect { load() } }
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)

    fun load() {
        job?.cancel()
        job = viewModelScope.launch {
            _ui.update { it.copy(loading = true, error = null) }
            when (val r = manage.branches(scopeStore.scope.value.schoolId, DateUtils.today())) {
                is Resource.Success -> _ui.update { it.copy(loading = false, loaded = true, branches = r.data.orEmpty()) }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchListScreen(navController: NavController, viewModel: BranchListViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = { SdTopBar(title = tr("Filiallar"), subtitle = tr("%s ta filial", ui.branches.size), onBack = { navController.popBackStack() }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { navController.navigate(Screen.BranchForm.createRoute()) }, containerColor = MaterialTheme.colorScheme.primary, shape = RoundedCornerShape(16.dp)) {
                Icon(Icons.Outlined.Add, tr("Qo'shish"), tint = MaterialTheme.colorScheme.onPrimary)
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.loading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                // Only the school picker here (a branch picker on a branch list makes no sense)
                if (schools.size > 1) item {
                    DropdownChip(
                        label = schools.firstOrNull { it.id == scope.schoolId }?.name ?: tr("Barcha maktablar"),
                        options = listOf<Pair<Int?, String>>(null to tr("Barcha maktablar")) + schools.map { it.id as Int? to it.name },
                        onSelect = viewModel::selectSchool,
                        icon = Icons.Outlined.School
                    )
                }
                ui.error?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.branches.isEmpty()) item { EmptyState(tr("Filiallar topilmadi"), Icons.Outlined.Store) }
                items(ui.branches, key = { it.id }) { b -> BranchRow(b) { navController.navigate(Screen.BranchDetail.createRoute(b.id)) } }
            }
        }
    }
}

@Composable
private fun BranchRow(b: BranchDto, onClick: () -> Unit) {
    val c = SchoolDayTheme.colors
    SdCard(onClick = onClick, padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            RowIcon(Icons.Outlined.Store, c.accentText, c.indigoBg, size = 42)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(b.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(b.schoolName, tr("%s smena", b.shiftsCount), tr("%s qurilma", b.devicesCount)).joinToString(" · "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text("${b.presentStudents}/${b.totalStudents}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = c.success)
                if (b.lateStudents > 0) Text(tr("Kechikkan: %s", b.lateStudents), style = MaterialTheme.typography.labelSmall, color = c.warning)
            }
        }
    }
}

// ---------------- Detail ----------------

data class BranchDetailUi(val branch: BranchDto? = null, val loading: Boolean = false, val error: String? = null)

@HiltViewModel
class BranchDetailViewModel @Inject constructor(
    private val manage: ManageRepository,
    savedState: SavedStateHandle
) : ViewModel() {
    private val id: Int = savedState["branchId"] ?: 0
    private val _ui = MutableStateFlow(BranchDetailUi())
    val ui: StateFlow<BranchDetailUi> = _ui.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _ui.update { it.copy(loading = true, error = null) }
            when (val r = manage.branch(id, DateUtils.today())) {
                is Resource.Success -> _ui.update { it.copy(loading = false, branch = r.data) }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BranchDetailScreen(navController: NavController, viewModel: BranchDetailViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val c = SchoolDayTheme.colors
    val b = ui.branch
    OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = {
            SdTopBar(title = b?.name ?: tr("Filial"), subtitle = b?.schoolName, onBack = { navController.popBackStack() }) {
                if (b != null) IconButton(onClick = { navController.navigate(Screen.BranchForm.createRoute(b.id)) }) { Icon(Icons.Outlined.Edit, tr("Tahrirlash")) }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.loading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                ui.error?.let { item { ErrorBanner(it) } }
                if (b == null) return@LazyColumn
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatTile(tr("O'quvchi"), b.totalStudents, c.accentText, Modifier.weight(1f))
                        StatTile(tr("Kelgan"), b.presentStudents, c.success, Modifier.weight(1f))
                        StatTile(tr("Kechikkan"), b.lateStudents, c.warning, Modifier.weight(1f))
                    }
                }
                b.description?.takeIf { it.isNotBlank() }?.let { item { Text(it, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant) } }

                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        SectionTitle(tr("Smenalar va sinflar"), Modifier.weight(1f))
                        TextButton(onClick = { navController.navigate(Screen.Shifts.route) }) { Text(tr("Smenalar")) }
                    }
                }
                if (b.shifts.isEmpty()) item { EmptyState(tr("Smena qo'shilmagan"), Icons.Outlined.Schedule) }
                items(b.shifts, key = { "s${it.id}" }) { sh ->
                    SdCard {
                        Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(sh.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), modifier = Modifier.weight(1f))
                            Text("${sh.startTime.orEmpty()} – ${sh.endTime.orEmpty()}", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        RowDivider()
                        sh.classes.forEach { cls ->
                            Row(
                                Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                TextButton(onClick = { navController.navigate(Screen.ClassDetail.createRoute(cls.id, DateUtils.today())) }) { Text(cls.name) }
                            }
                        }
                        TextButton(
                            onClick = { navController.navigate(Screen.ClassForm.createRoute(shiftId = sh.id)) },
                            modifier = Modifier.padding(horizontal = 6.dp)
                        ) {
                            Icon(Icons.Outlined.Add, null, Modifier.size(18.dp)); Spacer(Modifier.width(4.dp)); Text(tr("Sinf qo'shish"))
                        }
                    }
                }

                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        SectionTitle(tr("Qurilmalar"), Modifier.weight(1f))
                        TextButton(onClick = { navController.navigate(Screen.DeviceForm.createRoute(branchId = b.id)) }) { Text(tr("Qo'shish")) }
                    }
                }
                if (b.devices.isEmpty()) item { EmptyState(tr("Qurilmalar topilmadi"), Icons.Outlined.Router) }
                if (b.devices.isNotEmpty()) item {
                    SdCard {
                        b.devices.forEachIndexed { i, d ->
                            if (i > 0) RowDivider()
                            Row(
                                Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(Modifier.size(8.dp).clip(CircleShape).background(if (d.isOnline) c.success else c.danger))
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(d.name ?: d.deviceId ?: d.macAddress ?: "—", style = MaterialTheme.typography.bodyLarge)
                                    Text(listOfNotNull(d.connectionType?.uppercase(), d.deviceId ?: d.macAddress).joinToString(" · "), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                IconButton(onClick = { navController.navigate(Screen.DeviceForm.createRoute(deviceId = d.id, branchId = b.id)) }) {
                                    Icon(Icons.Outlined.Edit, tr("Tahrirlash"), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// ---------------- Form ----------------

data class BranchFormUi(
    val isEdit: Boolean = false,
    val schoolId: Int? = null,
    val name: String = "",
    val description: String = "",
    val macs: List<String> = emptyList(),
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val done: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class BranchFormViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore,
    savedState: SavedStateHandle
) : ViewModel() {
    private val branchId: Int? = savedState.get<Int>("branchId")?.takeIf { it > 0 }
    private val _ui = MutableStateFlow(BranchFormUi(isEdit = branchId != null, schoolId = scopeStore.scope.value.schoolId))
    val ui: StateFlow<BranchFormUi> = _ui.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools

    init {
        viewModelScope.launch {
            scopeStore.load()
            if (_ui.value.schoolId == null) scopeStore.schools.value.singleOrNull()?.let { s -> _ui.update { it.copy(schoolId = s.id) } }
        }
        branchId?.let { id ->
            viewModelScope.launch {
                _ui.update { it.copy(loading = true) }
                when (val r = manage.branch(id, null)) {
                    is Resource.Success -> r.data!!.let { b ->
                        _ui.update { it.copy(loading = false, schoolId = b.schoolId, name = b.name, description = b.description.orEmpty(), macs = b.macAddresses) }
                    }
                    is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
                }
            }
        }
    }

    fun edit(change: (BranchFormUi) -> BranchFormUi) = _ui.update { change(it).copy(error = null) }

    fun save() {
        val s = _ui.value
        if (s.name.isBlank()) return _ui.update { it.copy(error = tr("Filial nomini kiriting")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            val body = BranchBody(s.schoolId, s.name.trim(), s.description.trim().ifBlank { null }, s.macs.map { it.trim() }.filter { it.isNotEmpty() })
            when (val r = manage.saveBranch(branchId, body)) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(saving = false, done = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun delete() {
        val id = branchId ?: return
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.deleteBranch(id)) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(saving = false, done = true, deleted = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }
}

@Composable
fun BranchFormScreen(navController: NavController, viewModel: BranchFormViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, if (ui.deleted) tr("O'chirildi") else tr("Saqlandi"), Toast.LENGTH_SHORT).show()
            navController.finishForm(deletedFromDetail = ui.deleted)
        }
    }
    if (confirmDelete) {
        TypeToConfirmDialog(
            tr("Filialni o'chirish"),
            tr("Smenasi yoki o'quvchisi bor filialni o'chirib bo'lmaydi."),
            ui.name,
            { confirmDelete = false; viewModel.delete() },
            { confirmDelete = false }
        )
    }

    FormScaffold(
        title = if (ui.isEdit) tr("Filialni tahrirlash") else tr("Yangi filial"),
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
        if (schools.size > 1) {
            SelectField(tr("Maktab"), ui.schoolId, schools.map { it.id as Int? to it.name }, { v -> viewModel.edit { it.copy(schoolId = v) } })
        }
        SdTextField(ui.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("Filial nomi"))
        SdTextField(ui.description, { v -> viewModel.edit { it.copy(description = v) } }, tr("Izoh"), singleLine = false, minLines = 2)

        FormSectionTitle(tr("HTTP terminallar (MAC manzil)"))
        Text(
            tr("ISUP qurilmalari \"Qurilmalar\" bo'limida qo'shiladi. Bu yerda faqat HTTP orqali ulanadigan terminallar."),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        ui.macs.forEachIndexed { i, mac ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                SdTextField(mac, { v -> viewModel.edit { it.copy(macs = it.macs.toMutableList().also { l -> l[i] = v.uppercase() }) } }, tr("MAC manzil"), Modifier.weight(1f), placeholder = "AA:BB:CC:DD:EE:FF")
                IconButton(onClick = { viewModel.edit { it.copy(macs = it.macs.filterIndexed { j, _ -> j != i }) } }) {
                    Icon(Icons.Outlined.RemoveCircleOutline, tr("O'chirish"), tint = SchoolDayTheme.colors.danger)
                }
            }
        }
        OutlinedButton(onClick = { viewModel.edit { it.copy(macs = it.macs + "") } }, modifier = Modifier.fillMaxWidth()) {
            Icon(Icons.Outlined.Add, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text(tr("MAC manzil qo'shish"))
        }
    }
}
