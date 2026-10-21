package uz.schoolday.app.presentation.monitoring

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.remote.dto.MonitoringDto
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.util.DateUtils
import javax.inject.Inject

/** Which students a class card lists. */
enum class MonitoringFilter { All, Present, Late, Absent }

data class MonitoringUiState(
    val date: String = DateUtils.today(),
    val data: MonitoringDto? = null,
    val filter: MonitoringFilter = MonitoringFilter.All,
    val expanded: Set<Int> = emptySet(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class MonitoringViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(MonitoringUiState())
    val uiState: StateFlow<MonitoringUiState> = _uiState.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch { scopeStore.scope.collect { load() } }
    }

    fun onDateChange(date: String) {
        _uiState.update { it.copy(date = date, data = null) }
        load()
    }

    fun onFilter(filter: MonitoringFilter) = _uiState.update { it.copy(filter = filter) }

    fun toggle(classId: Int) = _uiState.update {
        it.copy(expanded = if (classId in it.expanded) it.expanded - classId else it.expanded + classId)
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    /** [silent] = background poll: no spinner, and a failed poll keeps the last data on screen. */
    fun load(silent: Boolean = false) {
        if (silent && job?.isActive == true) return
        job?.cancel()
        job = viewModelScope.launch {
            if (!silent) _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val s = scopeStore.scope.value
            when (val r = repository.monitoring(_uiState.value.date, s.schoolId, s.branchId)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, data = r.data, errorMessage = null) }
                is Resource.Error -> if (!silent) _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}
