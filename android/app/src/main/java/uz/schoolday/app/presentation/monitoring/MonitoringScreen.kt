package uz.schoolday.app.presentation.monitoring

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Groups
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.NavController
import kotlinx.coroutines.delay
import uz.schoolday.app.data.remote.dto.MonitoringClass
import uz.schoolday.app.data.remote.dto.MonitoringStudent
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.BottomBarContentPadding
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr

private const val POLL_MS = 30_000L

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MonitoringScreen(navController: NavController, viewModel: MonitoringViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    val c = SchoolDayTheme.colors
    val isToday = ui.date == DateUtils.today()

    // Today's picture changes as children walk in: refresh while the screen is visible
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(isToday, lifecycle) {
        if (!isToday) return@LaunchedEffect
        lifecycle.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                delay(POLL_MS)
                viewModel.load(silent = true)
            }
        }
    }

    val branches = ui.data?.branches.orEmpty()
    val total = branches.sumOf { it.total }
    val present = branches.sumOf { it.present }
    val late = branches.sumOf { it.late }

    PullToRefreshBox(
        isRefreshing = ui.isLoading,
        onRefresh = { viewModel.load() },
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().statusBarsPadding(),
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 16.dp, bottom = BottomBarContentPadding),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                SdHeader(
                    title = tr("Monitoring"),
                    overline = if (isToday && ui.data != null) tr("Yangilandi: %s", ui.data?.updatedAt.orEmpty()) else DateUtils.formatLongDate(ui.date)
                ) {
                    if (isToday) LiveDot()
                }
            }
            item { ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) }
            item { DateStepper(ui.date, viewModel::onDateChange) }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatTile(tr("Kelgan"), present, c.success, Modifier.weight(1f)) { viewModel.onFilter(MonitoringFilter.Present) }
                    StatTile(tr("Kechikkan"), late, c.warning, Modifier.weight(1f)) { viewModel.onFilter(MonitoringFilter.Late) }
                    StatTile(tr("Kelmagan"), (total - present).coerceAtLeast(0), c.danger, Modifier.weight(1f)) { viewModel.onFilter(MonitoringFilter.Absent) }
                }
            }
            item {
                SegmentedTabs(
                    options = listOf(tr("Hammasi"), tr("Kelgan"), tr("Kechikkan"), tr("Kelmagan")),
                    selected = ui.filter.ordinal,
                    onSelect = { viewModel.onFilter(MonitoringFilter.entries[it]) }
                )
            }

            ui.errorMessage?.let { item { ErrorBanner(it) } }

            if (ui.data != null && branches.all { it.classes.isEmpty() }) {
                item { EmptyState(tr("Sinflar topilmadi"), Icons.Outlined.Groups) }
            }

            branches.forEach { branch ->
                if (branches.size > 1) {
                    item(key = "b${branch.id}") {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(top = 6.dp)) {
                            Text(branch.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), modifier = Modifier.weight(1f))
                            Text("${branch.present}/${branch.total}", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                items(branch.classes, key = { "c${it.id}" }) { cls ->
                    ClassCard(
                        cls = cls,
                        filter = ui.filter,
                        expanded = cls.id in ui.expanded,
                        onToggle = { viewModel.toggle(cls.id) },
                        onOpenClass = { navController.navigate(Screen.ClassDetail.createRoute(cls.id, ui.date)) },
                        onOpenStudent = { navController.navigate(Screen.StudentDetail.createRoute(it)) }
                    )
                }
            }
        }
    }
}

@Composable
private fun LiveDot() {
    val c = SchoolDayTheme.colors
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.clip(RoundedCornerShape(99.dp)).background(c.successBg).padding(horizontal = 10.dp, vertical = 5.dp)
    ) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(c.success))
        Spacer(Modifier.width(6.dp))
        Text(tr("Jonli"), style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = c.success)
    }
}

private fun MonitoringStudent.matches(filter: MonitoringFilter) = when (filter) {
    MonitoringFilter.All -> true
    MonitoringFilter.Present -> status != "absent"
    MonitoringFilter.Late -> status == "late"
    MonitoringFilter.Absent -> status == "absent"
}

@Composable
private fun ClassCard(
    cls: MonitoringClass,
    filter: MonitoringFilter,
    expanded: Boolean,
    onToggle: () -> Unit,
    onOpenClass: () -> Unit,
    onOpenStudent: (Int) -> Unit
) {
    val c = SchoolDayTheme.colors
    val shown = cls.students.filter { it.matches(filter) }
    val absent = (cls.total - cls.present).coerceAtLeast(0)
    SdCard {
        Column(Modifier.fillMaxWidth().clickable(onClick = onToggle).padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(cls.name, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    cls.shiftName?.let { Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
                Text("${cls.present}/${cls.total}", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = c.success)
                Spacer(Modifier.width(6.dp))
                Icon(if (expanded) Icons.Rounded.KeyboardArrowUp else Icons.Rounded.KeyboardArrowDown, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(Modifier.height(10.dp))
            Row(
                Modifier.fillMaxWidth().height(6.dp).clip(CircleShape).background(c.surface2),
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                val onTime = cls.present - cls.late
                if (onTime > 0) Box(Modifier.weight(onTime.toFloat()).fillMaxHeight().background(c.success))
                if (cls.late > 0) Box(Modifier.weight(cls.late.toFloat()).fillMaxHeight().background(c.warning))
                if (absent > 0) Box(Modifier.weight(absent.toFloat()).fillMaxHeight().background(c.danger.copy(alpha = 0.6f)))
            }
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (cls.late > 0) StatusPill(tr("Kechikkan: %s", cls.late), Tone.Warning)
                if (absent > 0) StatusPill(tr("Kelmagan: %s", absent), Tone.Danger)
                if (absent == 0 && cls.total > 0) StatusPill(tr("Hammasi keldi"), Tone.Success)
            }
        }
        AnimatedVisibility(expanded) {
            Column {
                RowDivider()
                if (shown.isEmpty()) {
                    Text(
                        tr("Bu ro'yxatda o'quvchi yo'q"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(14.dp)
                    )
                }
                shown.forEach { s ->
                    Row(
                        Modifier.fillMaxWidth().clickable { onOpenStudent(s.id) }.padding(horizontal = 14.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(Modifier.size(8.dp).clip(CircleShape).background(statusColor(s.status)))
                        Spacer(Modifier.width(10.dp))
                        Text(s.name, style = MaterialTheme.typography.bodyLarge, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                        s.firstCheckIn?.let {
                            Text(it, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.width(8.dp))
                        }
                        AttendancePill(s.status)
                    }
                }
                RowDivider()
                TextButton(onClick = onOpenClass, modifier = Modifier.align(Alignment.End).padding(end = 6.dp)) { Text(tr("Sinfni ochish")) }
            }
        }
    }
}
