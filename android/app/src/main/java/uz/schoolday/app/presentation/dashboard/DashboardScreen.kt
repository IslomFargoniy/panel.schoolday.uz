package uz.schoolday.app.presentation.dashboard

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import uz.schoolday.app.data.remote.dto.DayStats
import uz.schoolday.app.data.remote.dto.EventDto
import uz.schoolday.app.data.remote.dto.TrendDay
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.BottomBarContentPadding
import uz.schoolday.app.presentation.navigation.Screen
import uz.schoolday.app.presentation.navigation.navigateToTab
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(navController: NavController, viewModel: DashboardViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val scope by viewModel.scope.collectAsState()
    val c = SchoolDayTheme.colors
    val stats = ui.data?.stats ?: DayStats()
    val isToday = ui.date == DateUtils.today()
    var photo by remember { mutableStateOf<EventDto?>(null) }

    photo?.let { e ->
        PhotoViewerDialog(e.picture.orEmpty(), e.name.orEmpty(), listOfNotNull(e.className, DateUtils.formatTime(e.time)).joinToString(" · ")) { photo = null }
    }

    PullToRefreshBox(
        isRefreshing = ui.isLoading,
        onRefresh = viewModel::refresh,
        modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize().statusBarsPadding(),
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 16.dp, bottom = BottomBarContentPadding),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                SdHeader(
                    title = if (isToday) tr("Bugungi davomat") else tr("Davomat"),
                    overline = DateUtils.formatLongDate(ui.date)
                ) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(c.surface2)
                            .border(1.dp, c.borderStrong, CircleShape)
                            .clickable { navController.navigateToTab(Screen.Settings.route) },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Person, tr("Profil"), tint = c.accentText, modifier = Modifier.size(22.dp))
                    }
                }
            }

            item { ScopeBar(schools, scope, viewModel::selectSchool, viewModel::selectBranch) }
            item { DateStepper(ui.date, viewModel::onDateChange) }

            ui.errorMessage?.let { item { ErrorBanner(it) } }

            item {
                val caption = schools.flatMap { it.branches }.firstOrNull { it.id == scope.branchId }?.name
                    ?: schools.firstOrNull { it.id == scope.schoolId }?.name
                    ?: tr("Barcha maktablar")
                AttendanceHeroCard(stats, caption)
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatTile(tr("Vaqtida"), stats.onTime, c.success, Modifier.weight(1f))
                    StatTile(tr("Kechikkan"), stats.late, c.warning, Modifier.weight(1f))
                    StatTile(tr("Kelmagan"), stats.absent, c.danger, Modifier.weight(1f))
                }
            }

            ui.data?.trend?.takeIf { it.isNotEmpty() }?.let { trend -> item { TrendCard(trend) } }

            item { SectionTitle(tr("Tezkor amallar")) }
            item {
                SdCard {
                    QuickActionRow(tr("Monitoring"), tr("Sinflar bo'yicha jonli holat"), Icons.Outlined.Sensors, c.success, c.successBg) {
                        navController.navigateToTab(Screen.Monitoring.route)
                    }
                    RowDivider()
                    QuickActionRow(tr("Sinflar"), tr("Har bir sinfning bugungi davomati"), Icons.Outlined.Class, c.warning, c.warningBg) {
                        navController.navigate(Screen.Classes.route)
                    }
                    RowDivider()
                    QuickActionRow(tr("Hisobotlar"), tr("Davr bo'yicha davomat va Excel"), Icons.Outlined.Assessment, c.accentText, c.indigoBg) {
                        navController.navigate(Screen.Reports.route)
                    }
                    RowDivider()
                    QuickActionRow(tr("Qurilmalar"), tr("Face ID terminallar holati"), Icons.Outlined.Router, MaterialTheme.colorScheme.onSurfaceVariant, c.surface2) {
                        navController.navigate(Screen.Devices.route)
                    }
                }
            }

            val events = ui.data?.recentEvents.orEmpty()
            if (events.isNotEmpty()) {
                item { SectionTitle(tr("Oxirgi kirishlar")) }
                item {
                    SdCard {
                        events.forEachIndexed { i, e ->
                            if (i > 0) RowDivider()
                            EventRow(
                                e,
                                onPhoto = { photo = e },
                                onClick = e.studentId?.let { id -> { navController.navigate(Screen.StudentDetail.createRoute(id)) } }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AttendanceHeroCard(stats: DayStats, caption: String) {
    val c = SchoolDayTheme.colors
    val arrived = stats.present
    val total = stats.totalStudents
    val fraction = if (total > 0) arrived.toFloat() / total else 0f
    val animated by animateFloatAsState(targetValue = fraction, animationSpec = tween(700), label = "ring")
    val heroBrush = if (c.isDark) {
        Brush.linearGradient(listOf(Color(0xFF1B2153), Color(0xFF141A3A), MaterialTheme.colorScheme.surface))
    } else {
        Brush.linearGradient(listOf(Color(0xFFE8EBFF), Color(0xFFF3F4FF), MaterialTheme.colorScheme.surface))
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(heroBrush)
            .border(1.dp, if (c.isDark) Color(0xFF2A3170) else c.border, RoundedCornerShape(24.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(84.dp), contentAlignment = Alignment.Center) {
                val track = if (c.isDark) Color(0xFF2A3170) else c.border
                val progress = c.success
                Canvas(Modifier.fillMaxSize()) {
                    val stroke = 9.dp.toPx()
                    val inset = stroke / 2
                    val arcSize = Size(size.width - stroke, size.height - stroke)
                    val topLeft = Offset(inset, inset)
                    drawArc(track, 0f, 360f, false, topLeft, arcSize, style = Stroke(stroke))
                    if (animated > 0f) drawArc(progress, -90f, 360f * animated, false, topLeft, arcSize, style = Stroke(stroke, cap = StrokeCap.Round))
                }
                Text("${(fraction * 100).toInt()}%", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            }
            Spacer(Modifier.width(16.dp))
            Column {
                Text(tr("KELGANLAR"), style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.8.sp), color = c.accentText)
                Row(verticalAlignment = Alignment.Bottom) {
                    Text("$arrived", style = MaterialTheme.typography.headlineLarge)
                    Text(
                        tr(" / %s o'quvchi", total),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 5.dp)
                    )
                }
                Text(caption, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }

        // Distribution: on time / late / absent
        Row(
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape).background(c.surface2),
            horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            if (stats.onTime > 0) Box(Modifier.weight(stats.onTime.toFloat()).fillMaxHeight().background(c.success))
            if (stats.late > 0) Box(Modifier.weight(stats.late.toFloat()).fillMaxHeight().background(c.warning))
            if (stats.absent > 0) Box(Modifier.weight(stats.absent.toFloat()).fillMaxHeight().background(c.danger.copy(alpha = 0.75f)))
        }
        if (stats.leftEarly > 0) {
            Text(tr("Erta ketganlar: %s", stats.leftEarly), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

/** Stacked bars for the last days: on time (green) under late (amber); days nobody came are school holidays. */
@Composable
private fun TrendCard(days: List<TrendDay>) {
    val c = SchoolDayTheme.colors
    val max = (days.maxOfOrNull { it.present + it.absent } ?: 0).coerceAtLeast(1)
    SdCard(padding = PaddingValues(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(tr("Haftalik dinamika"), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), modifier = Modifier.weight(1f))
            Legend(c.success, tr("Vaqtida"))
            Spacer(Modifier.width(10.dp))
            Legend(c.warning, tr("Kechikdi"))
        }
        Spacer(Modifier.height(14.dp))
        Row(Modifier.fillMaxWidth().height(120.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Bottom) {
            days.forEach { d ->
                Column(Modifier.weight(1f).fillMaxHeight(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Bottom) {
                    if (d.present > 0) {
                        Text("${d.present}", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.height(2.dp))
                    }
                    Canvas(Modifier.fillMaxWidth().weight(1f)) {
                        val w = size.width.coerceAtMost(22.dp.toPx())
                        val left = (size.width - w) / 2
                        val unit = size.height / max
                        val r = CornerRadius(6.dp.toPx())
                        // track
                        drawRoundRect(c.surface2, Offset(left, 0f), Size(w, size.height), r)
                        val onTimeH = d.onTime * unit
                        val lateH = d.late * unit
                        if (onTimeH + lateH > 0f) {
                            drawRoundRect(c.warning, Offset(left, size.height - onTimeH - lateH), Size(w, onTimeH + lateH), r)
                            if (onTimeH > 0f) drawRoundRect(c.success, Offset(left, size.height - onTimeH), Size(w, onTimeH), r)
                        }
                    }
                    Spacer(Modifier.height(6.dp))
                    Text(DateUtils.shortWeekday(d.date), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}

@Composable
private fun Legend(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(color))
        Spacer(Modifier.width(4.dp))
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun EventRow(e: EventDto, onPhoto: () -> Unit, onClick: (() -> Unit)? = null) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        SnapshotThumb(e.picture, onClick = onPhoto)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(e.name ?: e.employeeNo ?: "—", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(
                listOfNotNull(e.className, e.deviceName).joinToString(" · ").ifBlank { "—" },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(DateUtils.formatTime(e.time), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            e.time?.takeIf { it.take(10) != DateUtils.today() }?.let {
                Text(DateUtils.formatDayMonth(it), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun QuickActionRow(title: String, subtitle: String, icon: ImageVector, tint: Color, bg: Color, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RowIcon(icon, tint, bg, size = 40)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
        Icon(Icons.Rounded.ChevronRight, null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
