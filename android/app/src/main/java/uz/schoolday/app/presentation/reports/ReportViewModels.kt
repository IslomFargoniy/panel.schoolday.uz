package uz.schoolday.app.presentation.reports

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.AttendanceDto
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.ReportQuery
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.util.DateUtils
import java.io.File
import javax.inject.Inject

/** API values of the status filter, in the order of the tabs. */
val REPORT_STATUSES = listOf("all", "on_time", "late", "absent", "left_early")

data class ReportUiState(
    val startDate: String = DateUtils.today(),
    val endDate: String = DateUtils.today(),
    val status: String = "all",
    val classId: Int? = null,
    val shiftId: Int? = null,
    /** Filter by one student (picked by search). */
    val student: uz.schoolday.app.data.remote.dto.StudentDto? = null,
    val rows: List<AttendanceDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 0,
    val lastPage: Int = 1,
    /** The "absent" report covers at most 31 days; the server says where it stopped. */
    val truncatedAt: String? = null,
    val loaded: Boolean = false,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val isExporting: Boolean = false,
    /** Downloaded Excel file, waiting to be shared; cleared once the share sheet is opened. */
    val exportedFile: File? = null,
    val errorMessage: String? = null
) {
    val canLoadMore get() = page < lastPage
}

@HiltViewModel
class ReportViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {
    private val _uiState = MutableStateFlow(ReportUiState())
    val uiState: StateFlow<ReportUiState> = _uiState.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch { scopeStore.scope.collect { _uiState.update { it.copy(classId = null, shiftId = null) }; reload() } }
    }

    fun classes() = scopeStore.classes()

    fun onStart(date: String) {
        _uiState.update { it.copy(startDate = date, endDate = maxOf(date, it.endDate)) }
        reload()
    }

    fun onEnd(date: String) {
        _uiState.update { it.copy(endDate = date, startDate = minOf(date, it.startDate)) }
        reload()
    }

    fun onStatus(status: String) {
        _uiState.update { it.copy(status = status) }
        reload()
    }

    fun onClass(id: Int?) {
        _uiState.update { it.copy(classId = id) }
        reload()
    }

    fun onShift(id: Int?) {
        _uiState.update { it.copy(shiftId = id, classId = null) }
        reload()
    }

    fun onStudent(student: uz.schoolday.app.data.remote.dto.StudentDto?) {
        _uiState.update { it.copy(student = student) }
        reload()
    }

    /** Shifts within the picked school / branch. */
    fun shifts() = scopeStore.branches().filter { scopeStore.scope.value.branchId == null || it.id == scopeStore.scope.value.branchId }
        .flatMap { b -> b.shifts.map { it.id to "${it.name} · ${b.name}" } }

    suspend fun searchStudents(text: String) =
        (repository.students(text, scopeStore.scope.value.schoolId, scopeStore.scope.value.branchId, null, 1) as? Resource.Success)?.data?.items.orEmpty()

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    private fun query(): ReportQuery {
        val s = _uiState.value
        val scope = scopeStore.scope.value
        return ReportQuery(s.startDate, s.endDate, s.status, scope.schoolId, scope.branchId, s.classId, s.student?.id, s.shiftId)
    }

    fun reload() {
        job?.cancel()
        job = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            fetch(1)
        }
    }

    fun loadMore() {
        val s = _uiState.value
        if (!s.canLoadMore || s.isLoading || s.isLoadingMore) return
        job = viewModelScope.launch {
            _uiState.update { it.copy(isLoadingMore = true) }
            fetch(s.page + 1)
        }
    }

    private suspend fun fetch(page: Int) {
        when (val r = repository.reports(query(), page)) {
            is Resource.Success -> {
                val p = r.data!!
                _uiState.update {
                    it.copy(
                        rows = if (page == 1) p.items else it.rows + p.items,
                        page = p.meta.currentPage,
                        lastPage = p.meta.lastPage,
                        total = p.meta.total,
                        truncatedAt = p.meta.effectiveEndDate.takeIf { p.meta.rangeTruncated },
                        loaded = true,
                        isLoading = false,
                        isLoadingMore = false
                    )
                }
            }
            is Resource.Error -> _uiState.update { it.copy(isLoading = false, isLoadingMore = false, errorMessage = r.message) }
        }
    }

    fun export() {
        if (_uiState.value.isExporting) return
        viewModelScope.launch {
            _uiState.update { it.copy(isExporting = true, errorMessage = null) }
            when (val r = repository.exportReport(query())) {
                is Resource.Success -> _uiState.update { it.copy(isExporting = false, exportedFile = r.data) }
                is Resource.Error -> _uiState.update { it.copy(isExporting = false, errorMessage = r.message) }
            }
        }
    }

    fun onShared() = _uiState.update { it.copy(exportedFile = null) }
}

data class ReportDetailUiState(
    val attendance: AttendanceDto? = null,
    val deleted: Boolean = false,
    val message: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class ReportDetailViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val manage: uz.schoolday.app.data.repository.ManageRepository,
    savedState: SavedStateHandle
) : ViewModel() {
    private val id: Int = savedState["attendanceId"] ?: 0
    private val _uiState = MutableStateFlow(ReportDetailUiState())
    val uiState: StateFlow<ReportDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            when (val r = repository.report(id)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, attendance = r.data) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }

    fun deleteAttendance() {
        viewModelScope.launch {
            when (val r = manage.deleteAttendance(id)) {
                is Resource.Success -> _uiState.update { it.copy(deleted = true) }
                is Resource.Error -> _uiState.update { it.copy(message = r.message) }
            }
        }
    }

    fun deleteEvent(eventId: Int) {
        viewModelScope.launch {
            when (val r = manage.deleteEvent(eventId)) {
                is Resource.Success -> {
                    _uiState.update { s -> s.copy(attendance = s.attendance?.copy(events = s.attendance.events.filter { it.id != eventId }), message = uz.schoolday.app.util.tr("O'chirildi")) }
                }
                is Resource.Error -> _uiState.update { it.copy(message = r.message) }
            }
        }
    }

    fun onMessageShown() = _uiState.update { it.copy(message = null) }
}
