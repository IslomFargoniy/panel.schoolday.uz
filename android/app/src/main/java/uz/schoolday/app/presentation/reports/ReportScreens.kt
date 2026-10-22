package uz.schoolday.app.presentation.reports

import android.content.Intent
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import uz.schoolday.app.data.remote.dto.AttendanceDto
import uz.schoolday.app.data.remote.dto.EventDto
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.dashboard.EventRow
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportScreen(navController: NavController, viewModel: ReportViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    val classes = remember(schools, scope) { viewModel.classes() }
    val shifts = remember(schools, scope) { viewModel.shifts() }
    var pickStudent by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val c = SchoolDayTheme.colors
    val listState = rememberLazyListState()

    // Hand the downloaded .xlsx to Telegram, Drive, Excel…
    LaunchedEffect(ui.exportedFile) {
        val file = ui.exportedFile ?: return@LaunchedEffect
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            putExtra(Intent.EXTRA_STREAM, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        context.startActivity(Intent.createChooser(intent, tr("Hisobotni ulashish")))
        viewModel.onShared()
    }

    val nearEnd by remember {
        derivedStateOf {
            val last = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= listState.layoutInfo.totalItemsCount - 4
        }
    }
    LaunchedEffect(nearEnd, ui.rows.size) { if (nearEnd) viewModel.loadMore() }
    uz.schoolday.app.presentation.navigation.OnChangedReturn(navController) { viewModel.reload() }

    if (pickStudent) {
        StudentPickerDialog(
            search = viewModel::searchStudents,
            onPick = { pickStudent = false; viewModel.onStudent(it) },
            onDismiss = { pickStudent = false }
        )
    }

    val statusLabels = listOf(tr("Hammasi"), tr("Vaqtida"), tr("Kechikkan"), tr("Kelmagan"), tr("Erta ketgan"))

    Scaffold(
        topBar = {
            SdTopBar(
                title = tr("Hisobotlar"),
                subtitle = if (ui.loaded) tr("%s ta yozuv", ui.total) else null,
                onBack = { navController.popBackStack() }
            ) {
                if (ui.isExporting) {
                    CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.padding(end = 14.dp).size(22.dp))
                } else {
                    IconButton(onClick = viewModel::export, enabled = ui.total > 0) {
                        Icon(Icons.Outlined.FileDownload, tr("Excel"), tint = if (ui.total > 0) c.success else MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = viewModel::reload, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                state = listState,
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        DateField(ui.startDate, viewModel::onStart, tr("Boshlanish"), Modifier.weight(1f))
                        DateField(ui.endDate, viewModel::onEnd, tr("Tugash"), Modifier.weight(1f))
                    }
                }
                item {
                    ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) {
                        if (shifts.size > 1) {
                            DropdownChip(
                                label = shifts.firstOrNull { it.first == ui.shiftId }?.second ?: tr("Barcha smenalar"),
                                options = listOf<Pair<Int?, String>>(null to tr("Barcha smenalar")) + shifts.map { it.first as Int? to it.second },
                                onSelect = viewModel::onShift,
                                icon = Icons.Outlined.Schedule
                            )
                        }
                        if (classes.isNotEmpty()) {
                            DropdownChip(
                                label = classes.firstOrNull { it.id == ui.classId }?.name ?: tr("Barcha sinflar"),
                                options = listOf<Pair<Int?, String>>(null to tr("Barcha sinflar")) + classes.map { it.id as Int? to it.name },
                                onSelect = viewModel::onClass,
                                icon = Icons.Outlined.Class
                            )
                        }
                        // One student: tap to search, tap again to clear
                        val student = ui.student
                        if (student == null) {
                            AssistChip(onClick = { pickStudent = true }, label = { Text(tr("O'quvchi")) }, leadingIcon = { Icon(Icons.Outlined.PersonSearch, null, Modifier.size(16.dp)) })
                        } else {
                            InputChip(
                                selected = true,
                                onClick = { viewModel.onStudent(null) },
                                label = { Text(student.name, maxLines = 1) },
                                trailingIcon = { Icon(Icons.Outlined.Close, tr("Tozalash"), Modifier.size(16.dp)) }
                            )
                        }
                    }
                }
                item {
                    // Five labels don't fit a segmented bar on a phone: scrolling chips instead
                    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        REPORT_STATUSES.forEachIndexed { i, status ->
                            FilterChip(
                                selected = ui.status == status,
                                onClick = { viewModel.onStatus(status) },
                                label = { Text(statusLabels[i]) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primary,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimary
                                )
                            )
                        }
                    }
                }
                ui.truncatedAt?.let {
                    item {
                        Text(
                            tr("Kelmaganlar hisoboti ko'pi bilan 31 kun: %s gacha ko'rsatildi.", DateUtils.formatDisplayDate(it)),
                            style = MaterialTheme.typography.bodyMedium,
                            color = c.warning
                        )
                    }
                }
                ui.errorMessage?.let { item { ErrorBanner(it) } }
                if (ui.loaded && ui.rows.isEmpty() && !ui.isLoading) item { EmptyState(tr("Bu davr uchun yozuv yo'q"), Icons.Outlined.Assessment) }
                // Absent rows have no id: key by student and date
                itemsIndexed(ui.rows, key = { i, r -> r.id?.toString() ?: "a${r.student?.id}-${r.date}-$i" }) { _, row ->
                    ReportRow(row) { row.id?.let { navController.navigate(Screen.ReportDetail.createRoute(it)) } }
                }
                if (ui.isLoadingMore) item { LoadingBox() }
            }
        }
    }
}

@Composable
private fun ReportRow(a: AttendanceDto, onClick: () -> Unit) {
    val s = a.student
    SdCard(onClick = if (a.id != null) onClick else null, padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(s?.faceImage, s?.name.orEmpty(), sizeDp = 42)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(s?.name ?: "—", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(DateUtils.formatDisplayDate(a.date), s?.className).joinToString(" · "),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                AttendancePill(a.status)
                if (a.status != "absent") {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "${DateUtils.formatTime(a.firstCheckIn)} → ${DateUtils.formatTime(a.lastCheckOut)}",
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportDetailScreen(attendanceId: Int, navController: NavController, viewModel: ReportDetailViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val c = SchoolDayTheme.colors
    val a = ui.attendance
    var photo by remember { mutableStateOf<EventDto?>(null) }
    var confirmDelete by remember { mutableStateOf(false) }
    var deletingEvent by remember { mutableStateOf<EventDto?>(null) }
    val context = LocalContext.current

    LaunchedEffect(ui.deleted) {
        if (ui.deleted) {
            android.widget.Toast.makeText(context, tr("O'chirildi"), android.widget.Toast.LENGTH_SHORT).show()
            navController.finishForm()
        }
    }
    LaunchedEffect(ui.message) {
        ui.message?.let { android.widget.Toast.makeText(context, it, android.widget.Toast.LENGTH_LONG).show(); viewModel.onMessageShown() }
    }
    if (confirmDelete) {
        ConfirmDeleteDialog(
            tr("Davomatni o'chirish"),
            tr("Bu kunning davomat yozuvi o'chiriladi. Qurilma hodisalari qoladi."),
            { confirmDelete = false; viewModel.deleteAttendance() },
            { confirmDelete = false }
        )
    }
    deletingEvent?.let { e ->
        ConfirmDeleteDialog(
            tr("Hodisani o'chirish"),
            tr("%s dagi kirish hodisasi o'chirilsinmi?", DateUtils.formatTime(e.time)),
            { deletingEvent = null; viewModel.deleteEvent(e.id) },
            { deletingEvent = null }
        )
    }

    photo?.let { e -> PhotoViewerDialog(e.picture.orEmpty(), e.name.orEmpty(), DateUtils.formatTime(e.time)) { photo = null } }

    Scaffold(
        topBar = {
            SdTopBar(
                title = a?.student?.name ?: tr("Davomat"),
                subtitle = a?.let { DateUtils.formatLongDate(it.date) },
                onBack = { navController.popBackStack() }
            ) {
                if (a?.id != null) {
                    IconButton(onClick = { confirmDelete = true }) { Icon(Icons.Outlined.DeleteOutline, tr("O'chirish"), tint = c.danger) }
                }
            }
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = viewModel::load, modifier = Modifier.fillMaxSize().padding(padding)) {
            LazyColumn(
                contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 4.dp, bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                ui.errorMessage?.let { item { ErrorBanner(it) } }
                a?.let { att ->
                    item {
                        SdCard {
                            InfoLine(tr("Holat"), when (att.status) {
                                "on_time" -> tr("Vaqtida")
                                "late" -> tr("Kechikdi")
                                else -> tr("Kelmadi")
                            }, valueColor = statusColor(att.status))
                            InfoLine(tr("Kirish vaqti"), DateUtils.formatTime(att.firstCheckIn))
                            InfoLine(tr("Chiqish vaqti"), DateUtils.formatTime(att.lastCheckOut))
                            InfoLine(tr("Dars vaqti"), "${DateUtils.formatTime(att.startTime)} – ${DateUtils.formatTime(att.endTime)}")
                            InfoLine(tr("Sinf"), att.student?.className ?: "—", divider = false)
                        }
                    }
                    att.student?.let { s ->
                        item {
                            OutlinedButton(onClick = { navController.navigate(Screen.StudentDetail.createRoute(s.id)) }, modifier = Modifier.fillMaxWidth()) {
                                Icon(Icons.Outlined.Person, null, modifier = Modifier.size(18.dp))
                                Spacer(Modifier.width(8.dp))
                                Text(tr("O'quvchi sahifasi"))
                            }
                        }
                    }
                    item { SectionTitle(tr("Qurilma hodisalari")) }
                    if (att.events.isEmpty()) {
                        item { EmptyState(tr("Hodisalar topilmadi"), Icons.Outlined.Face) }
                    } else {
                        item {
                            SdCard {
                                att.events.forEachIndexed { i, e ->
                                    if (i > 0) RowDivider()
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(Modifier.weight(1f)) { EventRow(e, onPhoto = { photo = e }) }
                                        IconButton(onClick = { deletingEvent = e }) {
                                            Icon(Icons.Outlined.DeleteOutline, tr("O'chirish"), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (att.isLeftEarly && att.lastCheckOut != null) {
                        item { StatusPill(tr("Erta ketgan"), Tone.Info) }
                    }
                }
            }
        }
    }
}

/** Search a student by name / ID / phone (within the picked school and branch). */
@Composable
fun StudentPickerDialog(
    search: suspend (String) -> List<uz.schoolday.app.data.remote.dto.StudentDto>,
    onPick: (uz.schoolday.app.data.remote.dto.StudentDto) -> Unit,
    onDismiss: () -> Unit
) {
    var text by remember { mutableStateOf("") }
    var results by remember { mutableStateOf(emptyList<uz.schoolday.app.data.remote.dto.StudentDto>()) }
    LaunchedEffect(text) {
        if (text.length < 2) { results = emptyList(); return@LaunchedEffect }
        kotlinx.coroutines.delay(300)
        results = search(text)
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(tr("O'quvchini tanlang")) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SdTextField(text, { text = it }, tr("Ism, ID yoki telefon..."))
                Column(Modifier.heightIn(max = 320.dp).verticalScroll(rememberScrollState())) {
                    results.forEach { s ->
                        Row(
                            Modifier.fillMaxWidth().clickable { onPick(s) }.padding(vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Avatar(s.faceImage, s.name, sizeDp = 34)
                            Spacer(Modifier.width(10.dp))
                            Column {
                                Text(s.name, style = MaterialTheme.typography.bodyLarge)
                                s.className?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    )
}
