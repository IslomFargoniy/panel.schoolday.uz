package uz.schoolday.app.presentation.structure

import android.widget.Toast
import androidx.compose.material3.Text
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.ClassBody
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class ClassFormUi(
    val isEdit: Boolean = false,
    val name: String = "",
    val shiftId: Int? = null,
    val telegramGroupId: String = "",
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val done: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class ClassFormViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore,
    savedState: SavedStateHandle
) : ViewModel() {
    private val classId: Int? = savedState.get<Int>("classId")?.takeIf { it > 0 }
    private val _ui = MutableStateFlow(ClassFormUi(isEdit = classId != null, shiftId = savedState.get<Int>("shiftId")?.takeIf { it > 0 }))
    val ui: StateFlow<ClassFormUi> = _ui.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools

    init {
        viewModelScope.launch { scopeStore.load() }
        classId?.let { id ->
            viewModelScope.launch {
                _ui.update { it.copy(loading = true) }
                when (val r = repository.classDetail(id, DateUtils.today())) {
                    is Resource.Success -> r.data!!.schoolClass.let { c ->
                        _ui.update { it.copy(loading = false, name = c.name, shiftId = c.shiftId, telegramGroupId = c.telegramGroupId.orEmpty()) }
                    }
                    is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
                }
            }
        }
    }

    fun edit(change: (ClassFormUi) -> ClassFormUi) = _ui.update { change(it).copy(error = null) }

    fun save() {
        val s = _ui.value
        if (s.name.isBlank()) return _ui.update { it.copy(error = tr("Sinf nomini kiriting")) }
        val shiftId = s.shiftId ?: return _ui.update { it.copy(error = tr("Smenani tanlang")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.saveClass(classId, ClassBody(s.name.trim(), shiftId, s.telegramGroupId.trim().ifBlank { null }))) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(saving = false, done = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun delete() {
        val id = classId ?: return
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.deleteClass(id)) {
                is Resource.Success -> { scopeStore.load(force = true); _ui.update { it.copy(saving = false, done = true, deleted = true) } }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }
}

/** "1-smena · Asosiy bino" for every shift the user may see. */
fun shiftOptions(schools: List<FilterSchool>): List<Pair<Int?, String>> = schools.flatMap { school ->
    school.branches.flatMap { b -> b.shifts.map { sh -> sh.id as Int? to "${sh.name} · ${b.name}" + if (schools.size > 1) " · ${school.name}" else "" } }
}

@Composable
fun ClassFormScreen(navController: NavController, viewModel: ClassFormViewModel = hiltViewModel()) {
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
        ConfirmDeleteDialog(tr("Sinfni o'chirish"), tr("%s o'chirilsinmi? O'quvchisi bor sinfni o'chirib bo'lmaydi.", ui.name), { confirmDelete = false; viewModel.delete() }, { confirmDelete = false })
    }

    FormScaffold(
        title = if (ui.isEdit) tr("Sinfni tahrirlash") else tr("Yangi sinf"),
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
        SdTextField(ui.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("Sinf nomi"), placeholder = "5-A")
        SelectField(tr("Smena"), ui.shiftId, shiftOptions(schools), { v -> viewModel.edit { it.copy(shiftId = v) } })
        SdTextField(
            ui.telegramGroupId, { v -> viewModel.edit { it.copy(telegramGroupId = v.filter { c -> c.isDigit() || c == '-' }) } },
            tr("Telegram guruh ID"), keyboardType = KeyboardType.Number, placeholder = "-1001234567890",
            supporting = tr("Kirish-chiqish xabarlari shu guruhga ham yuboriladi")
        )
        Text(
            tr("Guruh ID'sini bilish uchun botni guruhga qo'shing va /start yuboring."),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
