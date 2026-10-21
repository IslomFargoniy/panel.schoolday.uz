package uz.schoolday.app.data.repository

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import uz.schoolday.app.data.remote.dto.FilterBranch
import uz.schoolday.app.data.remote.dto.FilterClass
import uz.schoolday.app.data.remote.dto.FilterSchool
import javax.inject.Inject
import javax.inject.Singleton

/** School and branch chosen at the top of a screen; null = all of them. */
data class Scope(val schoolId: Int? = null, val branchId: Int? = null)

/**
 * The school → branch → shift → class tree the user may see, and the school/branch picked in it.
 * Shared by every screen, so picking a branch on Asosiy also applies to Monitoring and O'quvchilar.
 */
@Singleton
class ScopeStore @Inject constructor(private val repository: SchoolRepository) {
    private val _schools = MutableStateFlow<List<FilterSchool>>(emptyList())
    val schools: StateFlow<List<FilterSchool>> = _schools.asStateFlow()

    private val _scope = MutableStateFlow(Scope())
    val scope: StateFlow<Scope> = _scope.asStateFlow()

    /** Loads the tree once (or again with [force]); with a single school it is picked right away. */
    suspend fun load(force: Boolean = false) {
        if (_schools.value.isNotEmpty() && !force) return
        val result = repository.filters()
        if (result is Resource.Success) {
            val schools = result.data.orEmpty()
            _schools.value = schools
            if (schools.size == 1 && _scope.value.schoolId == null) _scope.value = Scope(schoolId = schools.first().id)
        }
    }

    fun selectSchool(id: Int?) = _scope.update { Scope(schoolId = id, branchId = null) }

    fun selectBranch(id: Int?) = _scope.update { it.copy(branchId = id) }

    fun clear() {
        _schools.value = emptyList()
        _scope.value = Scope()
    }

    /** Branches of the picked school (or of all schools). */
    fun branches(scope: Scope = _scope.value): List<FilterBranch> =
        _schools.value.filter { scope.schoolId == null || it.id == scope.schoolId }.flatMap { it.branches }

    /** Classes within the picked school / branch, sorted by name. */
    fun classes(scope: Scope = _scope.value): List<FilterClass> =
        branches(scope).filter { scope.branchId == null || it.id == scope.branchId }
            .flatMap { b -> b.shifts.flatMap { it.classes } }
            .sortedBy { it.name }
}
