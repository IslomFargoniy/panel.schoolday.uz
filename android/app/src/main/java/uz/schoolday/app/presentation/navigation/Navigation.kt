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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.currentBackStackEntryAsState
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

    // Management (create / edit). Optional ids: -1 = none.
    object StudentForm : Screen("student_form?studentId={studentId}&classId={classId}") {
        fun createRoute(studentId: Int? = null, classId: Int? = null) = query("student_form", "studentId" to studentId, "classId" to classId)
    }
    object ClassForm : Screen("class_form?classId={classId}&shiftId={shiftId}") {
        fun createRoute(classId: Int? = null, shiftId: Int? = null) = query("class_form", "classId" to classId, "shiftId" to shiftId)
    }
    object Shifts : Screen("shifts", "Smenalar")
    object Branches : Screen("branches", "Filiallar")
    object BranchDetail : Screen("branch/{branchId}") {
        fun createRoute(id: Int) = "branch/$id"
    }
    object BranchForm : Screen("branch_form?branchId={branchId}") {
        fun createRoute(branchId: Int? = null) = query("branch_form", "branchId" to branchId)
    }
    object DeviceForm : Screen("device_form?deviceId={deviceId}&branchId={branchId}") {
        fun createRoute(deviceId: Int? = null, branchId: Int? = null) = query("device_form", "deviceId" to deviceId, "branchId" to branchId)
    }
    object ProfileEdit : Screen("profile_edit")
    object TwoFactor : Screen("two_factor")

    // Admin / Superadmin
    object Schools : Screen("schools", "Maktablar")
    object SchoolForm : Screen("school_form?schoolId={schoolId}") {
        fun createRoute(schoolId: Int? = null) = query("school_form", "schoolId" to schoolId)
    }
    object Users : Screen("users", "Foydalanuvchilar")
    object UserForm : Screen("user_form?userId={userId}") {
        fun createRoute(userId: Int? = null) = query("user_form", "userId" to userId)
    }
    object SystemSettings : Screen("system_settings", "Tizim sozlamalari")
}

/** "student_form?studentId=5" — null values are left out (the screen then gets its default -1). */
private fun query(base: String, vararg args: Pair<String, Int?>): String {
    val q = args.filter { it.second != null }.joinToString("&") { "${it.first}=${it.second}" }
    return if (q.isEmpty()) base else "$base?$q"
}

val bottomNavItems = listOf(
    Screen.Dashboard,
    Screen.Monitoring,
    Screen.Students,
    Screen.Settings
)

/** Space a tab screen leaves at the bottom of its scrolling content so the floating bar doesn't cover it. */
val BottomBarContentPadding: Dp
    @Composable get() = glassBarInset() + 16.dp

/**
 * Floating glass tab bar (same as the EduCrm app): it blurs the content scrolling behind it,
 * and a pill slides on a spring to the chosen tab.
 */
@Composable
fun SdBottomBar(
    navController: NavController,
    backdrop: Backdrop,
    modifier: Modifier = Modifier,
    items: List<Screen> = bottomNavItems
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val colors = SchoolDayTheme.colors
    val selectedIndex = items.indexOfFirst { it.route == currentRoute }.coerceAtLeast(0)

    GlassTabBar(
        tabs = items.mapIndexed { index, screen ->
            val selected = index == selectedIndex
            GlassTab(
                label = tr(screen.title),
                icon = (if (selected) screen.selectedIcon else screen.icon) ?: Icons.Outlined.Circle,
                selected = selected,
                onClick = {
                    if (!selected) {
                        navController.navigate(screen.route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                }
            )
        },
        backdrop = backdrop,
        dark = colors.isDark,
        accent = colors.navSelected,
        accentDark = colors.navSelected,
        modifier = modifier
            .navigationBarsPadding()
            .padding(start = 16.dp, end = 16.dp, bottom = GlassBarBottomMargin)
    )
}
