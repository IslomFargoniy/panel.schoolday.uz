package uz.schoolday.app.presentation.students

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.EventDto
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.remote.dto.StudentDetailDto
import uz.schoolday.app.data.remote.dto.StudentDto
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.util.DateUtils
import javax.inject.Inject

data class StudentListUiState(
    val search: String = "",
    val classId: Int? = null,
    /** "active", "inactive" or "all". */
    val status: String = "active",
    val importing: Boolean = false,
    val downloading: Boolean = false,
    /** Downloaded template, waiting to be shared. */
    val templateFile: java.io.File? = null,
    val message: String? = null,
    val students: List<StudentDto> = emptyList(),
    val total: Int = 0,
    val page: Int = 0,
    val lastPage: Int = 1,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val errorMessage: String? = null
) {
    val canLoadMore get() = page < lastPage
}

@HiltViewModel
class StudentListViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(StudentListUiState())
    val uiState: StateFlow<StudentListUiState> = _uiState.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch {
            // A class picked under another school/branch no longer applies
            scopeStore.scope.collect { _uiState.update { it.copy(classId = null) }; reload() }
        }
    }

    /** Classes for the class chip, within the picked school/branch. */
    fun classes() = scopeStore.classes()

    fun onSearch(text: String) {
        _uiState.update { it.copy(search = text) }
        reload(debounce = true)
    }

    fun onClass(id: Int?) {
        _uiState.update { it.copy(classId = id) }
        reload()
    }

    fun onStatus(status: String) {
        _uiState.update { it.copy(status = status) }
        reload()
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    fun downloadTemplate() {
        viewModelScope.launch {
            _uiState.update { it.copy(downloading = true) }
            when (val r = manage.studentsTemplate()) {
                is Resource.Success -> _uiState.update { it.copy(downloading = false, templateFile = r.data) }
                is Resource.Error -> _uiState.update { it.copy(downloading = false, message = r.message) }
            }
        }
    }

    fun onTemplateShared() = _uiState.update { it.copy(templateFile = null) }

    fun import(classId: Int, uri: android.net.Uri) {
        viewModelScope.launch {
            _uiState.update { it.copy(importing = true) }
            when (val r = manage.importStudents(classId, uri)) {
                is Resource.Success -> _uiState.update { it.copy(importing = false, message = uz.schoolday.app.util.tr("Import boshlandi. O'quvchilar bir necha daqiqada paydo bo'ladi.")) }
                is Resource.Error -> _uiState.update { it.copy(importing = false, message = r.message) }
            }
        }
    }

    fun onMessageShown() = _uiState.update { it.copy(message = null) }

    fun reload(debounce: Boolean = false) {
        job?.cancel()
        job = viewModelScope.launch {
            if (debounce) delay(350)
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
        val s = _uiState.value
        val scope = scopeStore.scope.value
        when (val r = manage.students(s.search, scope, s.classId, s.status, page)) {
            is Resource.Success -> {
                val p = r.data!!
                _uiState.update {
                    it.copy(
                        students = if (page == 1) p.items else it.students + p.items,
                        page = p.meta.currentPage,
                        lastPage = p.meta.lastPage,
                        total = p.meta.total,
                        isLoading = false,
                        isLoadingMore = false
                    )
                }
            }
            is Resource.Error -> _uiState.update { it.copy(isLoading = false, isLoadingMore = false, errorMessage = r.message) }
        }
    }
}

data class StudentDetailUiState(
    val month: String = DateUtils.currentMonth(),
    val detail: StudentDetailDto? = null,
    val events: List<EventDto>? = null,
    val tab: Int = 0,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class StudentDetailViewModel @Inject constructor(
    private val repository: SchoolRepository,
    savedState: SavedStateHandle
) : ViewModel() {
    private val studentId: Int = savedState["studentId"] ?: 0

    private val _uiState = MutableStateFlow(StudentDetailUiState())
    val uiState: StateFlow<StudentDetailUiState> = _uiState.asStateFlow()

    init {
        load()
    }

    fun onMonth(month: String) {
        _uiState.update { it.copy(month = month) }
        load()
    }

    fun onTab(tab: Int) {
        _uiState.update { it.copy(tab = tab) }
        if (tab == 1 && _uiState.value.events == null) loadEvents()
    }

    fun load() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            when (val r = repository.student(studentId, _uiState.value.month)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, detail = r.data) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }

    private fun loadEvents() {
        viewModelScope.launch {
            when (val r = repository.studentEvents(studentId)) {
                is Resource.Success -> _uiState.update { it.copy(events = r.data) }
                is Resource.Error -> _uiState.update { it.copy(events = emptyList(), errorMessage = r.message) }
            }
        }
    }
}
