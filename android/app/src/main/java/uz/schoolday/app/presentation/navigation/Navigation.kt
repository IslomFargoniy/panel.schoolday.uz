package uz.schoolday.app.presentation.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.People
import androidx.compose.material.icons.rounded.Person
import androidx.compose.material.icons.rounded.Sensors
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.HazeStyle
import dev.chrisbanes.haze.HazeTint
import dev.chrisbanes.haze.hazeEffect
import kotlinx.coroutines.launch
import uz.schoolday.app.presentation.components.pressScale
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.tr
import kotlin.math.sqrt

sealed class Screen(
    val route: String,
    val title: String = "",
    val icon: ImageVector? = null,
    val selectedIcon: ImageVector? = null
) {
    object Login : Screen("login")

    // Bottom bar tabs
    object Dashboard : Screen("dashboard", "Asosiy", Icons.Outlined.Home, Icons.Rounded.Home)
    object Monitoring : Screen("monitoring", "Monitoring", Icons.Outlined.Sensors, Icons.Rounded.Sensors)
    object Students : Screen("students", "O'quvchilar", Icons.Outlined.People, Icons.Rounded.People)
    object Settings : Screen("settings", "Profil", Icons.Outlined.Person, Icons.Rounded.Person)

    // Drawer screens
    object Reports : Screen("reports", "Hisobotlar")
    object Classes : Screen("classes", "Sinflar")
    object Devices : Screen("devices", "Qurilmalar")

    // Sub screens
    object StudentDetail : Screen("student/{studentId}") {
        fun createRoute(id: Int) = "student/$id"
    }
    object ClassDetail : Screen("class/{classId}?date={date}") {
        fun createRoute(id: Int, date: String) = "class/$id?date=$date"
    }
    object ReportDetail : Screen("report/{attendanceId}") {
        fun createRoute(id: Int) = "report/$id"
    }
    object ChangePassword : Screen("change_password", "Parolni o'zgartirish")
}

val bottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Monitoring,
    Screen.Students,
    Screen.Settings
)

/** Space a tab screen leaves at the bottom of its scrolling content so the floating bar doesn't cover it. */
val BottomBarContentPadding = 104.dp

private val BarShape = RoundedCornerShape(32.dp)
private val BarHeight = 64.dp
private val IndicatorInset = 5.dp

/**
 * Floating "liquid glass" tab bar (same as multitest.uz): frosted backdrop blur of the content behind it,
 * and a glass droplet indicator whose edges travel on different springs so it stretches toward the new tab.
 */
@Composable
fun SdBottomBar(
    navController: NavController,
    hazeState: HazeState,
    modifier: Modifier = Modifier,
    items: List<Screen> = bottomNavItems
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val colors = SchoolDayTheme.colors
    val selectedIndex = items.indexOfFirst { it.route == currentRoute }.coerceAtLeast(0)

    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(start = 20.dp, end = 20.dp, bottom = 12.dp)
            .shadow(
                elevation = if (colors.isDark) 24.dp else 16.dp,
                shape = BarShape,
                ambientColor = Color.Black,
                spotColor = if (colors.isDark) Color.Black else Color.Black.copy(alpha = 0.35f)
            )
            .clip(BarShape)
            .hazeEffect(
                state = hazeState,
                style = HazeStyle(
                    backgroundColor = colors.glassBarBase,
                    tints = listOf(HazeTint(colors.glassBarTint)),
                    blurRadius = 28.dp,
                    noiseFactor = 0.08f,
                    fallbackTint = HazeTint(MaterialTheme.colorScheme.surface.copy(alpha = 0.96f))
                )
            )
            .border(
                width = 1.dp,
                brush = Brush.verticalGradient(listOf(colors.glassBarStrokeTop, colors.glassBarStrokeBottom)),
                shape = BarShape
            )
            .height(BarHeight)
    ) {
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val density = LocalDensity.current
            val itemWidthPx = with(density) { maxWidth.toPx() } / items.size
            val insetPx = with(density) { IndicatorInset.toPx() }

            val left = remember { Animatable(selectedIndex * itemWidthPx + insetPx) }
            val right = remember { Animatable((selectedIndex + 1) * itemWidthPx - insetPx) }

            LaunchedEffect(selectedIndex, itemWidthPx) {
                val targetLeft = selectedIndex * itemWidthPx + insetPx
                val targetRight = (selectedIndex + 1) * itemWidthPx - insetPx
                // The leading edge races ahead, the trailing edge follows: that lag is the "liquid" stretch.
                val lead = spring<Float>(dampingRatio = 0.72f, stiffness = 900f)
                val trail = spring<Float>(dampingRatio = 0.78f, stiffness = 240f)
                val movingRight = targetLeft > left.value
                launch { left.animateTo(targetLeft, if (movingRight) trail else lead) }
                launch { right.animateTo(targetRight, if (movingRight) lead else trail) }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .drawBehind {
                        val restWidth = itemWidthPx - insetPx * 2
                        val width = (right.value - left.value).coerceAtLeast(restWidth * 0.5f)
                        // Conserve "volume": a stretched droplet gets thinner.
                        val stretch = width / restWidth
                        val height = (size.height - insetPx * 2) / sqrt(stretch.coerceAtLeast(1f))
                        val top = (size.height - height) / 2
                        val radius = CornerRadius(height / 2, height / 2)
                        val topLeft = Offset(left.value, top)
                        val pill = Size(width, height)

                        // Colored glow under the droplet
                        drawRoundRect(
                            brush = Brush.radialGradient(
                                colors = listOf(colors.dropletGlow, Color.Transparent),
                                center = Offset(left.value + width / 2, size.height / 2),
                                radius = width * 0.75f
                            ),
                            topLeft = topLeft,
                            size = pill,
                            cornerRadius = radius
                        )
                        // Glass body
                        drawRoundRect(
                            brush = Brush.verticalGradient(
                                colors = listOf(colors.dropletFillTop, colors.dropletFillBottom),
                                startY = top,
                                endY = top + height
                            ),
                            topLeft = topLeft,
                            size = pill,
                            cornerRadius = radius
                        )
                        // Specular rim: bright on top, fading out at the bottom
                        drawRoundRect(
                            brush = Brush.verticalGradient(
                                colors = listOf(colors.dropletRimTop, colors.dropletRimBottom),
                                startY = top,
                                endY = top + height
                            ),
                            topLeft = topLeft,
                            size = pill,
                            cornerRadius = radius,
                            style = Stroke(width = 1.dp.toPx())
                        )
                    }
            ) {
                Row(modifier = Modifier.fillMaxSize()) {
                    items.forEachIndexed { index, screen ->
                        LiquidTabItem(
                            screen = screen,
                            selected = index == selectedIndex,
                            onClick = {
                                if (index != selectedIndex) {
                                    navController.navigate(screen.route) {
                                        popUpTo(navController.graph.findStartDestination().id) {
                                            saveState = true
                                        }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LiquidTabItem(
    screen: Screen,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interaction = remember { MutableInteractionSource() }
    val tint by animateColorAsState(
        targetValue = if (selected) SchoolDayTheme.colors.navSelected else MaterialTheme.colorScheme.onSurfaceVariant,
        label = "tabTint"
    )

    Column(
        modifier = modifier
            .fillMaxHeight()
            .pressScale(interaction, pressedScale = 0.86f)
            .clickable(
                interactionSource = interaction,
                indication = null,
                role = Role.Tab,
                onClick = onClick
            ),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = (if (selected) screen.selectedIcon else screen.icon) ?: Icons.Outlined.Circle,
            contentDescription = tr(screen.title),
            tint = tint,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = tr(screen.title),
            maxLines = 1,
            style = MaterialTheme.typography.labelSmall.copy(
                color = tint,
                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium
            )
        )
    }
}
