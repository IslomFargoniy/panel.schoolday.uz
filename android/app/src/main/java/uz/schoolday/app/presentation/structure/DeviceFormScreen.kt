package uz.schoolday.app.presentation.structure

import android.widget.Toast
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.DeviceBody
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.ManageRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.util.formatMacInput
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class DeviceFormUi(
    val isEdit: Boolean = false,
    val branchId: Int? = null,
    val type: String = "isup",
    val name: String = "",
    val deviceId: String = "",
    val mac: String = "",
    val key: String = "",
    val hasKey: Boolean = false,
    val loading: Boolean = false,
    val saving: Boolean = false,
    val error: String? = null,
    val done: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class DeviceFormViewModel @Inject constructor(
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore,
    savedState: SavedStateHandle
) : ViewModel() {
    private val deviceId: Int? = savedState.get<Int>("deviceId")?.takeIf { it > 0 }
    private val _ui = MutableStateFlow(DeviceFormUi(isEdit = deviceId != null, branchId = savedState.get<Int>("branchId")?.takeIf { it > 0 }))
    val ui: StateFlow<DeviceFormUi> = _ui.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools

    init {
        viewModelScope.launch { scopeStore.load() }
        deviceId?.let { id ->
            viewModelScope.launch {
                _ui.update { it.copy(loading = true) }
                // No single-device endpoint: the list (all schools the user sees) has it
                when (val r = manage.devices(Scope(), null, null)) {
                    is Resource.Success -> r.data.orEmpty().firstOrNull { it.id == id }?.let { d ->
                        _ui.update {
                            it.copy(
                                loading = false, branchId = d.branchId, type = d.connectionType ?: "isup", name = d.name.orEmpty(),
                                deviceId = d.deviceId.orEmpty(), mac = d.macAddress.orEmpty(), hasKey = d.hasEncryptionKey
                            )
                        }
                    } ?: _ui.update { it.copy(loading = false, error = tr("Qurilma topilmadi")) }
                    is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
                }
            }
        }
    }

    fun edit(change: (DeviceFormUi) -> DeviceFormUi) = _ui.update { change(it).copy(error = null) }

    fun save() {
        val s = _ui.value
        val branchId = s.branchId ?: return _ui.update { it.copy(error = tr("Filialni tanlang")) }
        if (s.type == "isup" && s.deviceId.isBlank()) return _ui.update { it.copy(error = tr("Device ID ni kiriting")) }
        if (s.type == "http_listening" && s.mac.isBlank()) return _ui.update { it.copy(error = tr("MAC manzilni kiriting")) }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            val body = DeviceBody(
                branchId = branchId,
                connectionType = s.type,
                name = s.name.trim().ifBlank { null },
                deviceId = s.deviceId.trim().takeIf { s.type == "isup" && it.isNotEmpty() },
                macAddress = s.mac.trim().uppercase().takeIf { s.type == "http_listening" && it.isNotEmpty() },
                encryptionKey = s.key.trim().ifBlank { null },
                keepEncryptionKey = if (s.isEdit) true else null
            )
            when (val r = manage.saveDevice(deviceId, body)) {
                is Resource.Success -> _ui.update { it.copy(saving = false, done = true) }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun delete() {
        val id = deviceId ?: return
        viewModelScope.launch {
            _ui.update { it.copy(saving = true) }
            when (val r = manage.deleteDevice(id)) {
                is Resource.Success -> _ui.update { it.copy(saving = false, done = true, deleted = true) }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }
}

@Composable
fun DeviceFormScreen(navController: NavController, viewModel: DeviceFormViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val context = LocalContext.current
    var confirmDelete by remember { mutableStateOf(false) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, if (ui.deleted) tr("O'chirildi") else tr("Saqlandi"), Toast.LENGTH_SHORT).show()
            navController.finishForm()
        }
    }
    if (confirmDelete) {
        ConfirmDeleteDialog(tr("Qurilmani o'chirish"), tr("%s o'chirilsinmi?", ui.name.ifBlank { ui.deviceId.ifBlank { ui.mac } }), { confirmDelete = false; viewModel.delete() }, { confirmDelete = false })
    }

    val branches = schools.flatMap { s -> s.branches.map { b -> b.id as Int? to (b.name + if (schools.size > 1) " · ${s.name}" else "") } }

    FormScaffold(
        title = if (ui.isEdit) tr("Qurilmani tahrirlash") else tr("Yangi qurilma"),
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
        SelectField(tr("Filial"), ui.branchId, branches, { v -> viewModel.edit { it.copy(branchId = v) } })
        SegmentedTabs(
            options = listOf("ISUP", "HTTP"),
            selected = if (ui.type == "isup") 0 else 1,
            onSelect = { i -> viewModel.edit { it.copy(type = if (i == 0) "isup" else "http_listening") } }
        )
        Text(
            if (ui.type == "isup") tr("Terminal serverga o'zi ulanadi (ISUP 5.0). Terminal sozlamasidagi Device ID kerak.")
            else tr("Server terminalni MAC manzil bo'yicha taniydi."),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        SdTextField(ui.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("Nomi"), placeholder = tr("Kirish eshigi"))
        if (ui.type == "isup") {
            SdTextField(ui.deviceId, { v -> viewModel.edit { it.copy(deviceId = v) } }, tr("Device ID"))
            SdTextField(
                ui.key, { v -> viewModel.edit { it.copy(key = v) } }, tr("Shifrlash kaliti"), password = true,
                supporting = if (ui.hasKey) tr("Kalit saqlangan. O'zgartirish uchun yangisini kiriting.") else tr("Terminaldagi ISUP kaliti")
            )
        } else {
            SdTextField(ui.mac, { v -> viewModel.edit { it.copy(mac = formatMacInput(v)) } }, tr("MAC manzil"), placeholder = "AA:BB:CC:DD:EE:FF")
        }
    }
}
