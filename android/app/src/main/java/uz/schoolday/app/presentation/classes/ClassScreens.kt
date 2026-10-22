package uz.schoolday.app.presentation.classes

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.outlined.PersonAdd
import androidx.compose.material.icons.automirrored.outlined.Send
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
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
import uz.schoolday.app.data.remote.dto.ClassDetailDto
import uz.schoolday.app.data.remote.dto.ClassDto
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.OnChangedReturn
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.students.StudentRow
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class ClassListUiState(
    val date: String = DateUtils.today(),
    val classes: List<ClassDto> = emptyList(),
    val loaded: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ClassListViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {
    private val _uiState = MutableStateFlow(ClassListUiState())
    val uiState: StateFlow<ClassListUiState> = _uiState.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch { scopeStore.scope.collect { load() } }
    }

    fun onDate(date: String) {
        _uiState.update { it.copy(date = date) }
        load()
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    fun load() {
        job?.cancel()
        job = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val s = scopeStore.scope.value
            when (val r = repository.classes(_uiState.value.date, s.schoolId, s.branchId)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, loaded = true, classes = r.data.orEmpty()) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassListScreen(navController: NavController, viewModel: ClassListViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = { SdTopBar(title = tr("Sinflar"), subtitle = tr("%s ta sinf", ui.classes.size), onBack = { navController.popBackStack() }) },
        floatingActionButton = {
            FloatingActionButton(onClick = { navController.navigate(Screen.ClassForm.createRoute()) }, containerColor = MaterialTheme.colorScheme.primary, shape = RoundedCornerShape(16.dp)) {
                Icon(Icons.Outlined.Add, tr("Qo'shish"), tint = MaterialTheme.colorScheme.onPrimary)
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item { ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) }
                item { DateStepper(ui.date, viewModel::onDate) }
                ui.errorMessage?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.classes.isEmpty()) item { EmptyState(tr("Sinflar topilmadi"), Icons.Outlined.Groups) }
                items(ui.classes, key = { it.id }) { cls ->
                    ClassRow(cls) { navController.navigate(Screen.ClassDetail.createRoute(cls.id, ui.date)) }
                }
            }
        }
    }
}

@Composable
private fun ClassRow(cls: ClassDto, onClick: () -> Unit) {
    val c = SchoolDayTheme.colors
    SdCard(onClick = onClick, padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(cls.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    if (cls.telegramLinked) {
                        Spacer(Modifier.width(6.dp))
                        Icon(Icons.AutoMirrored.Outlined.Send, tr("Telegram guruh ulangan"), tint = c.accentText, modifier = Modifier.size(15.dp))
                    }
                }
                Text(
                    listOfNotNull(cls.shiftName, cls.branchName).joinToString(" · "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text("${cls.presentStudents}/${cls.totalStudents}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = c.success)
        }
        Spacer(Modifier.height(10.dp))
        Row(Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(c.surface2), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            if (cls.onTimeStudents > 0) Box(Modifier.weight(cls.onTimeStudents.toFloat()).fillMaxHeight().background(c.success))
            if (cls.lateStudents > 0) Box(Modifier.weight(cls.lateStudents.toFloat()).fillMaxHeight().background(c.warning))
            if (cls.absentStudents > 0) Box(Modifier.weight(cls.absentStudents.toFloat()).fillMaxHeight().background(c.danger.copy(alpha = 0.6f)))
        }
        Spacer(Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            StatusPill(tr("Vaqtida: %s", cls.onTimeStudents), Tone.Success)
            if (cls.lateStudents > 0) StatusPill(tr("Kechikkan: %s", cls.lateStudents), Tone.Warning)
            if (cls.absentStudents > 0) StatusPill(tr("Kelmagan: %s", cls.absentStudents), Tone.Danger)
        }
    }
}

data class ClassDetailUiState(
    val date: String = DateUtils.today(),
    val detail: ClassDetailDto? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ClassDetailViewModel @Inject constructor(
    private val repository: SchoolRepository,
    savedState: SavedStateHandle
) : ViewModel() {
    private val classId: Int = savedState["classId"] ?: 0
    private val _uiState = MutableStateFlow(ClassDetailUiState(date = savedState["date"] ?: DateUtils.today()))
    val uiState: StateFlow<ClassDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun onDate(date: String) {
        _uiState.update { it.copy(date = date) }
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            when (val r = repository.classDetail(classId, _uiState.value.date)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, detail = r.data) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ClassDetailScreen(classId: Int, initialDate: String, navController: NavController, viewModel: ClassDetailViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val c = SchoolDayTheme.colors
    val cls = ui.detail?.schoolClass
    // Absent first: those are the ones a school admin calls about
    val students = ui.detail?.students.orEmpty().sortedBy {
        when (it.attendance?.status) { null, "absent" -> 0; "late" -> 1; else -> 2 }
    }

    OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = {
            SdTopBar(
                title = cls?.name ?: tr("Sinf"),
                subtitle = cls?.let { listOfNotNull(it.shiftName, it.branchName).joinToString(" · ") },
                onBack = { navController.popBackStack() }
            ) {
                if (cls != null) {
                    IconButton(onClick = { navController.navigate(Screen.StudentForm.createRoute(classId = cls.id)) }) { Icon(Icons.Outlined.PersonAdd, tr("O'quvchi qo'shish")) }
                    IconButton(onClick = { navController.navigate(Screen.ClassForm.createRoute(classId = cls.id)) }) { Icon(Icons.Outlined.Edit, tr("Tahrirlash")) }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item { DateStepper(ui.date, viewModel::onDate) }
                ui.errorMessage?.let { item { ErrorBanner(it) } }
                cls?.let {
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            StatTile(tr("Vaqtida"), it.onTimeStudents, c.success, Modifier.weight(1f))
                            StatTile(tr("Kechikkan"), it.lateStudents, c.warning, Modifier.weight(1f))
                            StatTile(tr("Kelmagan"), it.absentStudents, c.danger, Modifier.weight(1f))
                        }
                    }
                }
                if (ui.detail != null && students.isEmpty()) item { EmptyState(tr("Sinfda o'quvchi yo'q"), Icons.Outlined.Groups) }
                items(students, key = { it.id }) { s ->
                    val a = s.attendance
                    StudentRow(
                        s,
                        trailing = {
                            Column(horizontalAlignment = Alignment.End) {
                                AttendancePill(a?.status ?: "absent")
                                a?.firstCheckIn?.let {
                                    Spacer(Modifier.height(4.dp))
                                    Text(DateUtils.formatTime(it), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    ) { navController.navigate(Screen.StudentDetail.createRoute(s.id)) }
                }
            }
        }
    }
}
