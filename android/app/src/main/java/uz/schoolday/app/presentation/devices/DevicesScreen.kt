package uz.schoolday.app.presentation.devices

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.DeviceDto
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.data.repository.SchoolRepository
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class DevicesUiState(
    val devices: List<DeviceDto> = emptyList(),
    val online: Boolean? = null,
    val type: String? = null,
    val loaded: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class DevicesViewModel @Inject constructor(
    private val manage: uz.schoolday.app.data.repository.ManageRepository,
    private val scopeStore: ScopeStore
) : ViewModel() {
    private val _uiState = MutableStateFlow(DevicesUiState())
    val uiState: StateFlow<DevicesUiState> = _uiState.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools
    val scope: StateFlow<Scope> = scopeStore.scope
    private var job: Job? = null

    init {
        viewModelScope.launch { scopeStore.load() }
        viewModelScope.launch { scopeStore.scope.collect { load() } }
    }

    fun onOnline(v: Boolean?) {
        _uiState.update { it.copy(online = v) }
        load()
    }

    fun onType(v: String?) {
        _uiState.update { it.copy(type = v) }
        load()
    }

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    fun load() {
        job?.cancel()
        job = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val s = scopeStore.scope.value
            when (val r = manage.devices(s, _uiState.value.online, _uiState.value.type)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, loaded = true, devices = r.data.orEmpty()) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DevicesScreen(navController: NavController, viewModel: DevicesViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    val online = ui.devices.count { it.isOnline }
    uz.schoolday.app.presentation.navigation.OnChangedReturn(navController) { viewModel.load() }

    Scaffold(
        topBar = {
            SdTopBar(
                title = tr("Qurilmalar"),
                subtitle = if (ui.loaded) tr("%s / %s onlayn", online, ui.devices.size) else null,
                onBack = { navController.popBackStack() }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(uz.schoolday.app.presentation.navigation.Screen.DeviceForm.createRoute(branchId = scope.branchId)) },
                containerColor = MaterialTheme.colorScheme.primary,
                shape = androidx.compose.foundation.shape.RoundedCornerShape(16.dp)
            ) { Icon(androidx.compose.material.icons.Icons.Outlined.Add, tr("Qo'shish"), tint = MaterialTheme.colorScheme.onPrimary) }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 96.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) {
                        DropdownChip(
                            label = when (ui.online) { true -> tr("Onlayn"); false -> tr("Oflayn"); null -> tr("Barcha holatlar") },
                            options = listOf<Pair<Boolean?, String>>(null to tr("Barcha holatlar"), true to tr("Onlayn"), false to tr("Oflayn")),
                            onSelect = viewModel::onOnline,
                            icon = androidx.compose.material.icons.Icons.Outlined.Wifi
                        )
                        DropdownChip(
                            label = when (ui.type) { "isup" -> "ISUP"; "http_listening" -> "HTTP"; else -> tr("Barcha turlar") },
                            options = listOf<Pair<String?, String>>(null to tr("Barcha turlar"), "isup" to "ISUP", "http_listening" to "HTTP"),
                            onSelect = viewModel::onType,
                            icon = androidx.compose.material.icons.Icons.Outlined.Lan
                        )
                    }
                }
                ui.errorMessage?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.devices.isEmpty()) item { EmptyState(tr("Qurilmalar topilmadi"), Icons.Outlined.Router) }
                items(ui.devices, key = { it.id }) { d ->
                    DeviceRow(d) { navController.navigate(uz.schoolday.app.presentation.navigation.Screen.DeviceForm.createRoute(deviceId = d.id, branchId = d.branchId)) }
                }
            }
        }
    }
}

@Composable
private fun DeviceRow(d: DeviceDto, onClick: () -> Unit) {
    val c = SchoolDayTheme.colors
    SdCard(onClick = onClick, padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            RowIcon(Icons.Outlined.Router, if (d.isOnline) c.success else c.danger, if (d.isOnline) c.successBg else c.dangerBg, size = 42)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(d.name ?: d.deviceId ?: "—", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(d.branchName, d.connectionType?.uppercase()).joinToString(" · "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
            if (d.isOnline) StatusPill(tr("Onlayn"), Tone.Success) else StatusPill(tr("Oflayn"), Tone.Danger)
        }
        Spacer(Modifier.height(10.dp))
        RowDivider()
        Spacer(Modifier.height(8.dp))
        Text(
            tr("Oxirgi aloqa: %s", d.lastSeenAt?.let { "${DateUtils.formatDisplayDate(it)} ${DateUtils.formatTime(it)}" } ?: "—"),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        if (!d.status) Text(tr("Qurilma o'chirilgan"), style = MaterialTheme.typography.bodyMedium, color = c.warning)
    }
}
