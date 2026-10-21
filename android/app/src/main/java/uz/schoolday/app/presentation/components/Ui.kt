package uz.schoolday.app.presentation.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.PressInteraction
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.ArrowBack
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.Scope
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.initials
import uz.schoolday.app.util.tr

/** Opens the left drawer; null where there is no drawer (login). */
val LocalOpenDrawer = staticCompositionLocalOf<(() -> Unit)?> { null }

/**
 * Header of a tab screen (Asosiy, Monitoring, O'quvchilar, Profil): menu button, small overline,
 * big title, actions on the right. Same look on every tab.
 */
@Composable
fun SdHeader(
    title: String,
    overline: String? = null,
    modifier: Modifier = Modifier,
    actions: @Composable RowScope.() -> Unit = {}
) {
    val openDrawer = LocalOpenDrawer.current
    Row(modifier = modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        if (openDrawer != null) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(1.dp, SchoolDayTheme.colors.border, RoundedCornerShape(12.dp))
                    .clickable(onClick = openDrawer),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.Menu, contentDescription = tr("Menyu"), tint = MaterialTheme.colorScheme.onSurface)
            }
            Spacer(Modifier.width(12.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            if (overline != null) {
                Text(overline, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            }
            Text(
                title,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onBackground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Row(verticalAlignment = Alignment.CenterVertically, content = actions)
    }
}

/** Top bar of a pushed (non-tab) screen: back arrow, title, optional subtitle; same ground as the screen. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SdTopBar(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {}
) {
    TopAppBar(
        title = {
            Column {
                Text(title, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (!subtitle.isNullOrBlank()) {
                    Text(subtitle, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
                }
            }
        },
        navigationIcon = {
            if (onBack != null) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Outlined.ArrowBack, tr("Orqaga")) }
            }
        },
        actions = actions,
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.background,
            scrolledContainerColor = MaterialTheme.colorScheme.background,
            titleContentColor = MaterialTheme.colorScheme.onBackground,
            navigationIconContentColor = MaterialTheme.colorScheme.onBackground,
            actionIconContentColor = MaterialTheme.colorScheme.onSurfaceVariant
        )
    )
}

/** Bordered surface card used for every block (no shadow). */
@Composable
fun SdCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    padding: PaddingValues = PaddingValues(0.dp),
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, SchoolDayTheme.colors.border, RoundedCornerShape(18.dp))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(padding),
        content = content
    )
}

/** Divider between rows inside a [SdCard]. */
@Composable
fun RowDivider() = HorizontalDivider(color = SchoolDayTheme.colors.border)

/** Tinted rounded-square icon used in list rows. */
@Composable
fun RowIcon(icon: ImageVector, tint: Color, bg: Color, size: Int = 38) {
    Box(
        modifier = Modifier.size(size.dp).clip(RoundedCornerShape(12.dp)).background(bg),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size((size * 0.53f).dp))
    }
}

/** Bold section title between cards. */
@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text,
        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
        color = MaterialTheme.colorScheme.onBackground,
        modifier = modifier.padding(top = 10.dp, start = 2.dp)
    )
}

enum class Tone { Success, Warning, Danger, Info, Neutral }

/** Small coloured status label ("Vaqtida", "Kechikdi", "Kelmadi"…). */
@Composable
fun StatusPill(text: String, tone: Tone) {
    val c = SchoolDayTheme.colors
    val (bg, fg) = when (tone) {
        Tone.Success -> c.successBg to c.success
        Tone.Warning -> c.warningBg to c.warning
        Tone.Danger -> c.dangerBg to c.danger
        Tone.Info -> c.indigoBg to c.accentText
        Tone.Neutral -> c.surface2 to MaterialTheme.colorScheme.onSurfaceVariant
    }
    Text(
        text,
        color = fg,
        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold),
        maxLines = 1,
        modifier = Modifier.clip(RoundedCornerShape(99.dp)).background(bg).padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

/** Pill for a day's status from the API: "on_time", "late" or "absent". */
@Composable
fun AttendancePill(status: String) = when (status) {
    "on_time" -> StatusPill(tr("Vaqtida"), Tone.Success)
    "late" -> StatusPill(tr("Kechikdi"), Tone.Warning)
    else -> StatusPill(tr("Kelmadi"), Tone.Danger)
}

/** Colour of a day's status, for dots and numbers. */
@Composable
fun statusColor(status: String): Color = when (status) {
    "on_time" -> SchoolDayTheme.colors.success
    "late" -> SchoolDayTheme.colors.warning
    else -> SchoolDayTheme.colors.danger
}

/** Segmented tabs inside a screen (e.g. Davomat · Kirishlar). */
@Composable
fun SegmentedTabs(options: List<String>, selected: Int, onSelect: (Int) -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, SchoolDayTheme.colors.border, RoundedCornerShape(12.dp))
            .padding(3.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        options.forEachIndexed { i, label ->
            val on = i == selected
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(9.dp))
                    .background(if (on) MaterialTheme.colorScheme.primary else Color.Transparent)
                    .clickable { onSelect(i) }
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    label,
                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = if (on) FontWeight.Bold else FontWeight.Medium),
                    color = if (on) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
            }
        }
    }
}

/** Pill-shaped dropdown chip, e.g. branch picker. [options] are (value, label). */
@Composable
fun <T> DropdownChip(
    label: String,
    options: List<Pair<T, String>>,
    onSelect: (T) -> Unit,
    icon: ImageVector? = Icons.Outlined.Store
) {
    var open by remember { mutableStateOf(false) }
    Box {
        Row(
            modifier = Modifier
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, SchoolDayTheme.colors.border, CircleShape)
                .clickable(enabled = options.size > 1) { open = true }
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            if (icon != null) Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
            Text(
                label, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface, maxLines = 1,
                overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 200.dp)
            )
            if (options.size > 1) Icon(Icons.Rounded.KeyboardArrowDown, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(18.dp))
        }
        DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
            options.forEach { (value, text) ->
                DropdownMenuItem(text = { Text(text) }, onClick = { open = false; onSelect(value) })
            }
        }
    }
}

/**
 * School (when the user has several) and branch pickers, shared by every screen through ScopeStore.
 * [extra] adds more chips on the same scrolling row (e.g. a class filter).
 */
@Composable
fun ScopeBar(
    schools: List<FilterSchool>,
    scope: Scope,
    onSchool: (Int?) -> Unit,
    onBranch: (Int?) -> Unit,
    modifier: Modifier = Modifier,
    extra: @Composable RowScope.() -> Unit = {}
) {
    val branches = schools.filter { scope.schoolId == null || it.id == scope.schoolId }.flatMap { it.branches }
    Row(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = modifier.fillMaxWidth().horizontalScroll(rememberScrollState())
    ) {
        if (schools.size > 1) {
            DropdownChip(
                label = schools.firstOrNull { it.id == scope.schoolId }?.name ?: tr("Barcha maktablar"),
                options = listOf<Pair<Int?, String>>(null to tr("Barcha maktablar")) + schools.map { it.id as Int? to it.name },
                onSelect = onSchool,
                icon = Icons.Outlined.School
            )
        }
        if (branches.size > 1) {
            DropdownChip(
                label = branches.firstOrNull { it.id == scope.branchId }?.name ?: tr("Barcha filiallar"),
                options = listOf<Pair<Int?, String>>(null to tr("Barcha filiallar")) + branches.map { it.id as Int? to it.name },
                onSelect = onBranch
            )
        }
        extra()
    }
}

/** ‹ Chorshanba, 14-oktabr › — tap the middle to pick from a calendar. [date] is "yyyy-MM-dd". */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateStepper(date: String, onChange: (String) -> Unit, modifier: Modifier = Modifier) {
    var picking by remember { mutableStateOf(false) }
    val today = DateUtils.today()
    StepperRow(
        label = DateUtils.formatLongDate(date),
        onPrev = { onChange(DateUtils.shiftDay(date, -1)) },
        onNext = { onChange(DateUtils.shiftDay(date, 1)) },
        nextEnabled = date < today,
        onLabel = { picking = true },
        modifier = modifier
    )
    if (picking) {
        DatePickerDialogFor(date, maxDate = today, onPick = onChange, onDismiss = { picking = false })
    }
}

/** ‹ Oktabr 2026 › — [month] is "yyyy-MM". */
@Composable
fun MonthStepper(month: String, onChange: (String) -> Unit, modifier: Modifier = Modifier) {
    StepperRow(
        label = "${DateUtils.monthName(month)} ${month.take(4)}",
        onPrev = { onChange(DateUtils.shiftMonth(month, -1)) },
        onNext = { onChange(DateUtils.shiftMonth(month, 1)) },
        nextEnabled = month < DateUtils.currentMonth(),
        onLabel = null,
        modifier = modifier
    )
}

@Composable
private fun StepperRow(
    label: String,
    onPrev: () -> Unit,
    onNext: () -> Unit,
    nextEnabled: Boolean,
    onLabel: (() -> Unit)?,
    modifier: Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, SchoolDayTheme.colors.border, RoundedCornerShape(14.dp)),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onPrev) { Icon(Icons.Rounded.ChevronLeft, tr("Oldingi")) }
        Text(
            label,
            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
            color = MaterialTheme.colorScheme.onSurface,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .weight(1f)
                .then(if (onLabel != null) Modifier.clickable(onClick = onLabel) else Modifier)
                .padding(vertical = 10.dp)
        )
        IconButton(onClick = onNext, enabled = nextEnabled) { Icon(Icons.Rounded.ChevronRight, tr("Keyingi")) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DatePickerDialogFor(date: String, maxDate: String?, onPick: (String) -> Unit, onDismiss: () -> Unit) {
    val state = rememberDatePickerState(
        initialSelectedDateMillis = DateUtils.toUtcMillis(date),
        selectableDates = object : SelectableDates {
            override fun isSelectableDate(utcTimeMillis: Long) = maxDate == null || utcTimeMillis <= DateUtils.toUtcMillis(maxDate)
        }
    )
    DatePickerDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = { state.selectedDateMillis?.let { onPick(DateUtils.fromUtcMillis(it)) }; onDismiss() }) { Text(tr("Tanlash")) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text(tr("Bekor qilish")) } }
    ) { DatePicker(state = state) }
}

/** Read-only field that opens a calendar; [date] is "yyyy-MM-dd". */
@Composable
fun DateField(date: String, onChange: (String) -> Unit, label: String, modifier: Modifier = Modifier) {
    var open by remember { mutableStateOf(false) }
    val interaction = remember { MutableInteractionSource() }
    // A read-only text field swallows clicks, so react to its press events instead
    LaunchedEffect(interaction) {
        interaction.interactions.collect { if (it is PressInteraction.Release) open = true }
    }
    OutlinedTextField(
        value = DateUtils.formatDisplayDate(date),
        onValueChange = {},
        readOnly = true,
        label = { Text(label) },
        trailingIcon = { Icon(Icons.Outlined.CalendarMonth, null) },
        singleLine = true,
        interactionSource = interaction,
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    )
    if (open) DatePickerDialogFor(date, maxDate = DateUtils.today(), onPick = onChange, onDismiss = { open = false })
}

/** Label on the left, value on the right; for detail cards. */
@Composable
fun InfoLine(label: String, value: String, valueColor: Color = MaterialTheme.colorScheme.onSurface, divider: Boolean = true) {
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 11.dp)) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(1f))
        Text(value, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.SemiBold), color = valueColor)
    }
    if (divider) RowDivider()
}

/** Number tile: big coloured value, dot and label below. */
@Composable
fun StatTile(label: String, value: Int, color: Color, modifier: Modifier = Modifier, onClick: (() -> Unit)? = null) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, SchoolDayTheme.colors.border, RoundedCornerShape(18.dp))
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(12.dp)
    ) {
        Text("$value", style = MaterialTheme.typography.headlineMedium, color = color)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(7.dp).clip(CircleShape).background(color))
            Spacer(Modifier.width(6.dp))
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
        }
    }
}

/** Round photo, or the name's initials when there is none. */
@Composable
fun Avatar(url: String?, name: String, modifier: Modifier = Modifier, sizeDp: Int = 44) {
    val c = SchoolDayTheme.colors
    Box(
        modifier = modifier.size(sizeDp.dp).clip(CircleShape).background(c.indigoBg).border(1.dp, c.borderStrong, CircleShape),
        contentAlignment = Alignment.Center
    ) {
        if (!url.isNullOrBlank()) {
            AsyncImage(model = url, contentDescription = name, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        } else {
            Text(
                initials(name),
                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold, fontSize = (sizeDp / 2.6).sp),
                color = c.accentText
            )
        }
    }
}

/** Camera snapshot thumbnail; a placeholder icon when the event has no picture. */
@Composable
fun SnapshotThumb(url: String?, sizeDp: Int = 48, onClick: (() -> Unit)? = null) {
    val c = SchoolDayTheme.colors
    Box(
        modifier = Modifier
            .size(sizeDp.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(c.surface2)
            .then(if (onClick != null && url != null) Modifier.clickable(onClick = onClick) else Modifier),
        contentAlignment = Alignment.Center
    ) {
        if (url != null) {
            AsyncImage(model = url, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        } else {
            Icon(Icons.Outlined.Face, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size((sizeDp / 2).dp))
        }
    }
}

@Composable
fun EmptyState(
    message: String = tr("Ma'lumot topilmadi"),
    icon: ImageVector = Icons.Outlined.FolderOpen,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier.size(64.dp).clip(CircleShape).background(MaterialTheme.colorScheme.surfaceVariant),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(32.dp))
        }
        Spacer(Modifier.height(16.dp))
        Text(message, style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
        if (onRetry != null) {
            Spacer(Modifier.height(12.dp))
            OutlinedButton(onClick = onRetry) { Text(tr("Qayta urinish")) }
        }
    }
}

/** Red notice for a failed request. */
@Composable
fun ErrorBanner(message: String, modifier: Modifier = Modifier) {
    val c = SchoolDayTheme.colors
    Row(
        modifier = modifier.fillMaxWidth().clip(RoundedCornerShape(14.dp)).background(c.dangerBg).padding(horizontal = 14.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(Icons.Outlined.ErrorOutline, null, tint = c.danger, modifier = Modifier.size(18.dp))
        Spacer(Modifier.width(8.dp))
        Text(message, color = c.danger, style = MaterialTheme.typography.bodyMedium)
    }
}

/** Centred spinner for a first load. */
@Composable
fun LoadingBox(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(strokeWidth = 3.dp, modifier = Modifier.size(32.dp))
    }
}

/** Springy shrink while pressed (same feel as multitest.uz). */
fun Modifier.pressScale(interactionSource: MutableInteractionSource, pressedScale: Float = 0.96f): Modifier = composed {
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed) pressedScale else 1f,
        animationSpec = spring(dampingRatio = 0.55f, stiffness = 500f),
        label = "pressScale"
    )
    graphicsLayer {
        scaleX = scale
        scaleY = scale
    }
}

/** Full-screen camera snapshot; tap anywhere or press back to close. */
@Composable
fun PhotoViewerDialog(url: String, title: String, subtitle: String, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.92f))
                .clickable(onClick = onDismiss)
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            AsyncImage(
                model = url,
                contentDescription = title,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxWidth().weight(1f, fill = false).clip(RoundedCornerShape(12.dp))
            )
            Spacer(Modifier.height(14.dp))
            Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium)
            Text(subtitle, color = Color.White.copy(alpha = 0.7f), style = MaterialTheme.typography.bodyMedium)
        }
    }
}
