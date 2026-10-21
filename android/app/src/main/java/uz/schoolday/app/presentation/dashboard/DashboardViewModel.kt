package uz.schoolday.app.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.DashboardDto
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.util.DateUtils
import javax.inject.Inject

data class DashboardUiState(
    val date: String = DateUtils.today(),
    val data: DashboardDto? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        // Reload whenever the school/branch changes (also on any other screen)
        viewModelScope.launch { scopeStore.scope.collect { load() } }
    }

    fun onDateChange(date: String) {
        _uiState.update { it.copy(date = date) }
        load()
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    fun refresh() {
        viewModelScope.launch { scopeStore.load(force = true) }
        load()
    }

    private fun load() {
        job?.cancel()
        job = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val s = scopeStore.scope.value
            when (val r = repository.dashboard(_uiState.value.date, s.schoolId, s.branchId)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, data = r.data) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}
