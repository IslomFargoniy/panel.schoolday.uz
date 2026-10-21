package uz.schoolday.app.presentation.devices

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Router
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
    val loaded: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

@HiltViewModel
class DevicesViewModel @Inject constructor(
    private val repository: SchoolRepository,
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

    fun selectSchool(id: Int?) = scopeStore.selectSchool(id)
    fun selectBranch(id: Int?) = scopeStore.selectBranch(id)

    fun load() {
        job?.cancel()
        job = viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            val s = scopeStore.scope.value
            when (val r = repository.devices(s.schoolId, s.branchId)) {
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

    Scaffold(
        topBar = {
            SdTopBar(
                title = tr("Qurilmalar"),
                subtitle = if (ui.loaded) tr("%s / %s onlayn", online, ui.devices.size) else null,
                onBack = { navController.popBackStack() }
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item { ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) }
                ui.errorMessage?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.devices.isEmpty()) item { EmptyState(tr("Qurilmalar topilmadi"), Icons.Outlined.Router) }
                items(ui.devices, key = { it.id }) { DeviceRow(it) }
            }
        }
    }
}

@Composable
private fun DeviceRow(d: DeviceDto) {
    val c = SchoolDayTheme.colors
    SdCard(padding = PaddingValues(14.dp)) {
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
