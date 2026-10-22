package uz.schoolday.app.presentation.structure

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.remote.dto.ShiftBody
import uz.schoolday.app.data.remote.dto.ShiftDto
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class ShiftsUi(
    val shifts: List<ShiftDto> = emptyList(),
    val loaded: Boolean = false,
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    /** The dialog: null = closed, id 0 = new shift. */
    val editing: ShiftDto? = null,
    val dialogError: String? = null,
    val message: String? = null
)

@HiltViewModel
class ShiftsViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {
    private val _ui = MutableStateFlow(ShiftsUi())
    val ui: StateFlow<ShiftsUi> = _ui.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch { scopeStore.scope.collect { load() } }
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    fun load() {
        job?.cancel()
        job = viewModelScope.launch {
            _ui.update { it.copy(loading = true, error = null) }
            when (val r = manage.shifts(scopeStore.scope.value)) {
                is Resource.Success -> _ui.update { it.copy(loading = false, loaded = true, shifts = r.data.orEmpty()) }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun open(shift: ShiftDto?) = _ui.update {
        it.copy(editing = shift ?: ShiftDto(startTime = "08:00", endTime = "13:00", branchId = scopeStore.scope.value.branchId ?: 0), dialogError = null)
    }

    fun close() = _ui.update { it.copy(editing = null) }

    fun save(shift: ShiftDto) {
        if (shift.name.isBlank()) return _ui.update { it.copy(dialogError = tr("Smena nomini kiriting")) }
        if (shift.branchId == 0) return _ui.update { it.copy(dialogError = tr("Filialni tanlang")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true, dialogError = null) }
            val body = ShiftBody(shift.branchId, shift.name.trim(), shift.startTime, shift.endTime)
            when (val r = manage.saveShift(shift.id.takeIf { it > 0 }, body)) {
                is Resource.Success -> {
                    scopeStore.load(force = true)
                    _ui.update { it.copy(saving = false, editing = null, message = tr("Saqlandi")) }
                    load()
                }
                is Resource.Error -> _ui.update { it.copy(saving = false, dialogError = r.message) }
            }
        }
    }

    fun delete(shift: ShiftDto) {
        viewModelScope.launch {
            when (val r = manage.deleteShift(shift.id)) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(message = tr("O'chirildi")) }; load() }
                is Resource.Error -> _ui.update { it.copy(message = r.message) }
            }
        }
    }

    fun onMessageShown() = _ui.update { it.copy(message = null) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShiftsScreen(navController: NavController, viewModel: ShiftsViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    val context = LocalContext.current
    var deleting by remember { mutableStateOf<ShiftDto?>(null) }

    LaunchedEffect(ui.message) { ui.message?.let { Toast.makeText(context, it, Toast.LENGTH_LONG).show(); viewModel.onMessageShown() } }

    ui.editing?.let { e ->
        ShiftDialog(e, schools, ui.saving, ui.dialogError, viewModel::save, viewModel::close, onDelete = if (e.id > 0) ({ viewModel.close(); deleting = e }) else null)
    }
    deleting?.let { s ->
        ConfirmDeleteDialog(tr("Smenani o'chirish"), tr("%s o'chirilsinmi? Sinfi bor smenani o'chirib bo'lmaydi.", s.name), { deleting = null; viewModel.delete(s) }, { deleting = null })
    }

    Scaffold(
        topBar = { SdTopBar(title = tr("Smenalar"), subtitle = tr("Bitta filialda ko'pi bilan 2 ta smena"), onBack = { navController.popBackStack() }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { viewModel.open(null) }, containerColor = MaterialTheme.colorScheme.primary, shape = RoundedCornerShape(16.dp)) {
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
                item { ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) }
                ui.error?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.shifts.isEmpty()) item { EmptyState(tr("Smenalar topilmadi"), Icons.Outlined.Schedule) }
                items(ui.shifts, key = { it.id }) { s ->
                    SdCard(onClick = { viewModel.open(s) }, padding = PaddingValues(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RowIcon(Icons.Outlined.Schedule, SchoolDayTheme.colors.accentText, SchoolDayTheme.colors.indigoBg)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(s.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold))
                                Text(
                                    listOfNotNull(s.branchName, tr("%s ta sinf", s.classesCount)).joinToString(" · "),
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Text("${s.startTime} – ${s.endTime}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ShiftDialog(
    initial: ShiftDto,
    schools: List<FilterSchool>,
    saving: Boolean,
    error: String?,
    onSave: (ShiftDto) -> Unit,
    onDismiss: () -> Unit,
    onDelete: (() -> Unit)?
) {
    var s by remember(initial) { mutableStateOf(initial) }
    val branches = schools.flatMap { school -> school.branches.map { b -> b.id to (b.name + if (schools.size > 1) " · ${school.name}" else "") } }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial.id > 0) tr("Smenani tahrirlash") else tr("Yangi smena")) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                SdTextField(s.name, { s = s.copy(name = it) }, tr("Nomi"), placeholder = "1-smena")
                SelectField(tr("Filial"), s.branchId, branches, { s = s.copy(branchId = it) })
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    TimeField(s.startTime, { s = s.copy(startTime = it) }, tr("Boshlanishi"), Modifier.weight(1f))
                    TimeField(s.endTime, { s = s.copy(endTime = it) }, tr("Tugashi"), Modifier.weight(1f))
                }
                Text(tr("Boshlanish vaqtidan keyin kelganlar kechikkan hisoblanadi."), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                error?.let { Text(it, color = SchoolDayTheme.colors.danger, style = MaterialTheme.typography.bodyMedium) }
            }
        },
        confirmButton = { TextButton(onClick = { onSave(s) }, enabled = !saving) { Text(tr("Saqlash")) } },
        dismissButton = {
            Row {
                if (onDelete != null) {
                    TextButton(onClick = onDelete, colors = ButtonDefaults.textButtonColors(contentColor = SchoolDayTheme.colors.danger)) { Text(tr("O'chirish")) }
                }
                TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) }
            }
        }
    )
}
