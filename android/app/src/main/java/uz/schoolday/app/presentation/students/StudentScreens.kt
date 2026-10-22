package uz.schoolday.app.presentation.students

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import uz.schoolday.app.data.remote.dto.AttendanceDto
import uz.schoolday.app.data.remote.dto.EventDto
import uz.schoolday.app.data.remote.dto.StudentDto
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.dashboard.EventRow
import uz.schoolday.app.presentation.navigation.BottomBarContentPadding
import uz.schoolday.app.presentation.navigation.OnChangedReturn
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentListScreen(navController: NavController, viewModel: StudentListViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    val classes = remember(schools, scope) { viewModel.classes() }
    val listState = rememberLazyListState()
    val context = LocalContext.current
    var addMenu by remember { mutableStateOf(false) }
    var importOpen by remember { mutableStateOf(false) }

    OnChangedReturn(navController) { viewModel.reload() }

    LaunchedEffect(ui.message) {
        ui.message?.let {
            Toast.makeText(context, it, Toast.LENGTH_LONG).show()
            viewModel.onMessageShown()
        }
    }
    LaunchedEffect(ui.templateFile) {
        ui.templateFile?.let {
            shareExcel(context, it, tr("Excel shablon"))
            viewModel.onTemplateShared()
        }
    }

    if (importOpen) {
        ImportDialog(
            classes = classes.map { it.id to it.name },
            presetClassId = ui.classId,
            onImport = { classId, uri -> importOpen = false; viewModel.import(classId, uri) },
            onDismiss = { importOpen = false }
        )
    }

    // Next page when the last rows come into view
    val nearEnd by remember {
        derivedStateOf {
            val last = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            last >= listState.layoutInfo.totalItemsCount - 4
        }
    }
    LaunchedEffect(nearEnd, ui.students.size) { if (nearEnd) viewModel.loadMore() }

    Box(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(horizontal = 18.dp)) {
            Spacer(Modifier.height(16.dp))
            SdHeader(title = tr("O'quvchilar"), overline = tr("Jami: %s ta", ui.total)) {
                if (ui.importing || ui.downloading) CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(22.dp))
            }
            Spacer(Modifier.height(14.dp))
            OutlinedTextField(
                value = ui.search,
                onValueChange = viewModel::onSearch,
                placeholder = { Text(tr("Ism, ID yoki telefon...")) },
                leadingIcon = { Icon(Icons.Outlined.Search, null) },
                trailingIcon = {
                    if (ui.search.isNotEmpty()) IconButton(onClick = { viewModel.onSearch("") }) { Icon(Icons.Outlined.Clear, tr("Tozalash")) }
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(10.dp))
            ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) {
                if (classes.isNotEmpty()) {
                    DropdownChip(
                        label = classes.firstOrNull { it.id == ui.classId }?.name ?: tr("Barcha sinflar"),
                        options = listOf<Pair<Int?, String>>(null to tr("Barcha sinflar")) + classes.map { it.id as Int? to it.name },
                        onSelect = viewModel::onClass,
                        icon = Icons.Outlined.Class
                    )
                }
                DropdownChip(
                    label = when (ui.status) { "inactive" -> tr("Faol emas"); "all" -> tr("Hammasi"); else -> tr("Faol") },
                    options = listOf("active" to tr("Faol"), "inactive" to tr("Faol emas"), "all" to tr("Hammasi")),
                    onSelect = viewModel::onStatus,
                    icon = Icons.Outlined.FilterList
                )
            }
            Spacer(Modifier.height(10.dp))

            PullToRefreshBox(isRefreshing = ui.isLoading, onRefresh = { viewModel.reload() }, modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    state = listState,
                    contentPadding = PaddingValues(bottom = BottomBarContentPadding + 72.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    ui.errorMessage?.let { item { ErrorBanner(it) } }
                    if (ui.students.isEmpty() && !ui.isLoading && ui.errorMessage == null) {
                        item { EmptyState(tr("O'quvchilar topilmadi"), Icons.Outlined.PersonSearch) }
                    }
                    items(ui.students, key = { it.id }) { s ->
                        StudentRow(s, trailing = {
                            if (s.status == "inactive") StatusPill(tr("Faol emas"), Tone.Neutral)
                            else Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }) { navController.navigate(Screen.StudentDetail.createRoute(s.id)) }
                    }
                    if (ui.isLoadingMore) item { LoadingBox() }
                }
            }
        }

        Box(Modifier.align(Alignment.BottomEnd).padding(end = 18.dp, bottom = BottomBarContentPadding)) {
            FloatingActionButton(
                onClick = { addMenu = true },
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                shape = RoundedCornerShape(16.dp)
            ) { Icon(Icons.Outlined.Add, tr("Qo'shish")) }
            DropdownMenu(expanded = addMenu, onDismissRequest = { addMenu = false }) {
                DropdownMenuItem(
                    text = { Text(tr("Yangi o'quvchi")) },
                    leadingIcon = { Icon(Icons.Outlined.PersonAdd, null) },
                    onClick = { addMenu = false; navController.navigate(Screen.StudentForm.createRoute(classId = ui.classId)) }
                )
                DropdownMenuItem(
                    text = { Text(tr("Excel'dan import")) },
                    leadingIcon = { Icon(Icons.Outlined.UploadFile, null) },
                    onClick = { addMenu = false; importOpen = true }
                )
                DropdownMenuItem(
                    text = { Text(tr("Excel shablon")) },
                    leadingIcon = { Icon(Icons.Outlined.FileDownload, null) },
                    onClick = { addMenu = false; viewModel.downloadTemplate() }
                )
            }
        }
    }
}

/** Pick the class, then an .xlsx/.xls/.csv file with name, phone, gender columns (as in the template). */
@Composable
private fun ImportDialog(classes: List<Pair<Int, String>>, presetClassId: Int?, onImport: (Int, Uri) -> Unit, onDismiss: () -> Unit) {
    var classId by remember { mutableStateOf(presetClassId) }
    var file by remember { mutableStateOf<Uri?>(null) }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) file = uri }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(tr("Excel'dan import")) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(tr("Ustunlar: name, phone, gender. Avval shablonni yuklab oling."), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                SelectField(tr("Sinf"), classId, classes.map { it.first as Int? to it.second }, { classId = it })
                OutlinedButton(
                    onClick = {
                        picker.launch(arrayOf(
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            "application/vnd.ms-excel",
                            "text/csv",
                            "text/comma-separated-values"
                        ))
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Outlined.AttachFile, null, Modifier.size(18.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(if (file == null) tr("Faylni tanlash") else tr("Fayl tanlandi"))
                }
            }
        },
        confirmButton = {
            TextButton(onClick = { onImport(classId!!, file!!) }, enabled = classId != null && file != null) { Text(tr("Yuklash")) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    )
}

@Composable
fun StudentRow(s: StudentDto, trailing: @Composable () -> Unit = { Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant) }, onClick: () -> Unit) {
    SdCard(onClick = onClick, padding = PaddingValues(14.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Avatar(s.faceImage, s.name, sizeDp = 46)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(s.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    listOfNotNull(s.className, s.shiftName).joinToString(" · ").ifBlank { tr("Sinfsiz") },
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            trailing()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StudentDetailScreen(studentId: Int, navController: NavController, viewModel: StudentDetailViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val c = SchoolDayTheme.colors
    val student = ui.detail?.student
    var photo by remember { mutableStateOf<EventDto?>(null) }

    OnChangedReturn(navController) { viewModel.load() }

    photo?.let { e ->
        PhotoViewerDialog(e.picture.orEmpty(), e.name.orEmpty(), "${DateUtils.formatDisplayDate(e.time)} ${DateUtils.formatTime(e.time)}") { photo = null }
    }

    Scaffold(
        topBar = {
            SdTopBar(title = student?.name ?: tr("O'quvchi"), subtitle = student?.className, onBack = { navController.popBackStack() }) {
                if (student != null) {
                    IconButton(onClick = { navController.navigate(Screen.StudentForm.createRoute(studentId = studentId)) }) {
                        Icon(Icons.Outlined.Edit, tr("Tahrirlash"))
                    }
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

                student?.let { s ->
                    item {
                        SdCard(padding = PaddingValues(16.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Avatar(s.faceImage, s.name, sizeDp = 64)
                                Spacer(Modifier.width(14.dp))
                                Column(Modifier.weight(1f)) {
                                    Text(s.name, style = MaterialTheme.typography.headlineSmall, maxLines = 2, overflow = TextOverflow.Ellipsis)
                                    Text(
                                        listOfNotNull(s.className, s.branchName).joinToString(" · "),
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                    item {
                        SdCard {
                            InfoLine(tr("ID raqam"), s.employeeNo ?: "—")
                            InfoLine(tr("Telefon"), s.phone ?: "—")
                            InfoLine(tr("Smena"), s.shiftName ?: "—")
                            InfoLine(
                                tr("Telegram"),
                                if (s.telegramLinked) tr("Ulangan") else tr("Ulanmagan"),
                                valueColor = if (s.telegramLinked) c.success else c.danger,
                                divider = false
                            )
                        }
                    }
                }

                item { SegmentedTabs(listOf(tr("Davomat"), tr("Kirishlar")), ui.tab, viewModel::onTab) }

                if (ui.tab == 0) {
                    item { MonthStepper(ui.month, viewModel::onMonth) }
                    ui.detail?.summary?.let { sum ->
                        item {
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                StatTile(tr("Kelgan kun"), sum.present, c.success, Modifier.weight(1f))
                                StatTile(tr("Kechikkan"), sum.late, c.warning, Modifier.weight(1f))
                                StatTile(tr("Erta ketgan"), sum.leftEarly, c.accentText, Modifier.weight(1f))
                            }
                        }
                    }
                    val days = ui.detail?.attendances.orEmpty()
                    if (ui.detail != null && days.isEmpty()) {
                        item { EmptyState(tr("Bu oyda davomat yo'q"), Icons.Outlined.EventBusy) }
                    } else if (days.isNotEmpty()) {
                        item {
                            SdCard {
                                days.forEachIndexed { i, a ->
                                    if (i > 0) RowDivider()
                                    AttendanceDayRow(a) { a.id?.let { navController.navigate(Screen.ReportDetail.createRoute(it)) } }
                                }
                            }
                        }
                    }
                } else {
                    val events = ui.events
                    when {
                        events == null -> item { LoadingBox() }
                        events.isEmpty() -> item { EmptyState(tr("Kirishlar topilmadi"), Icons.Outlined.Face) }
                        else -> item {
                            SdCard {
                                events.forEachIndexed { i, e ->
                                    if (i > 0) RowDivider()
                                    EventRow(e, onPhoto = { photo = e })
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

/** "14.10 Se · 08:05 → 13:20" with the day's status pill. */
@Composable
fun AttendanceDayRow(a: AttendanceDto, onClick: (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null && a.id != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 14.dp, vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.width(54.dp)) {
            Text(DateUtils.formatDayMonth(a.date), style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold))
            Text(DateUtils.shortWeekday(a.date), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.width(8.dp))
        Column(Modifier.weight(1f)) {
            if (a.status != "absent") {
                Text(
                    "${DateUtils.formatTime(a.firstCheckIn)} → ${DateUtils.formatTime(a.lastCheckOut)}",
                    style = MaterialTheme.typography.bodyLarge
                )
                if (a.isLeftEarly && a.lastCheckOut != null) {
                    Text(tr("Erta ketgan"), style = MaterialTheme.typography.labelSmall, color = SchoolDayTheme.colors.accentText)
                }
            } else {
                Text("—", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        AttendancePill(a.status)
    }
}
