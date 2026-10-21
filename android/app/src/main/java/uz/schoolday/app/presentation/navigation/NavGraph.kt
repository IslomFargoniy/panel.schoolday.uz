package uz.schoolday.app.presentation.navigation

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.hazeSource
import kotlinx.coroutines.launch
import uz.schoolday.app.presentation.classes.ClassDetailScreen
import uz.schoolday.app.presentation.classes.ClassListScreen
import uz.schoolday.app.presentation.components.LocalOpenDrawer
import uz.schoolday.app.presentation.dashboard.DashboardScreen
import uz.schoolday.app.presentation.devices.DevicesScreen
import uz.schoolday.app.presentation.monitoring.MonitoringScreen
import uz.schoolday.app.presentation.reports.ReportDetailScreen
import uz.schoolday.app.presentation.reports.ReportScreen
import uz.schoolday.app.presentation.settings.ChangePasswordScreen
import uz.schoolday.app.presentation.settings.SettingsScreen
import uz.schoolday.app.presentation.settings.SettingsViewModel
import uz.schoolday.app.presentation.students.StudentDetailScreen
import uz.schoolday.app.presentation.students.StudentListScreen
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.tr

/** Switches bottom-bar tabs the same way the bar itself does, so tab state is saved and restored. */
fun NavController.navigateToTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

/** The signed-in app: tabs with the glass bar, the left drawer and the pushed screens. */
@Composable
fun MainNavGraph(userName: String) {
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val currentRoute = backStack?.destination?.route
    val isBottomBarVisible = currentRoute in bottomNavItems.map { it.route }
    val hazeState = remember { HazeState() }
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    // School names for the drawer header
    val settingsVm: SettingsViewModel = hiltViewModel()
    val settings by settingsVm.uiState.collectAsState()
    val schoolsLine = settings.user?.let { u ->
        if (u.isGlobalAdmin) tr("Administrator") else u.schools.joinToString(", ") { it.name }.ifBlank { tr("Maktab admini") }
    } ?: tr("Maktab admini")

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = drawerState.isOpen || isBottomBarVisible,
        drawerContent = {
            AppDrawer(
                userName = userName,
                subtitle = schoolsLine,
                groups = drawerGroups(),
                currentRoute = currentRoute,
                onOpen = { route ->
                    scope.launch { drawerState.close() }
                    if (route == currentRoute) return@AppDrawer
                    if (bottomNavItems.any { it.route == route }) navController.navigateToTab(route)
                    else navController.navigate(route) { launchSingleTop = true }
                }
            )
        }
    ) {
        BackHandler(enabled = drawerState.isOpen) { scope.launch { drawerState.close() } }
        CompositionLocalProvider(LocalOpenDrawer provides { scope.launch { drawerState.open() } }) {
            Box(modifier = Modifier.fillMaxSize()) {
                // Everything inside the source is what the glass bar blurs.
                NavHost(
                    navController = navController,
                    startDestination = Screen.Dashboard.route,
                    modifier = Modifier.fillMaxSize().hazeSource(state = hazeState)
                ) {
                    composable(Screen.Dashboard.route) { DashboardScreen(navController) }
                    composable(Screen.Monitoring.route) { MonitoringScreen(navController) }
                    composable(Screen.Students.route) { StudentListScreen(navController) }
                    composable(Screen.Settings.route) { SettingsScreen(navController) }

                    composable(Screen.Reports.route) { ReportScreen(navController) }
                    composable(Screen.Classes.route) { ClassListScreen(navController) }
                    composable(Screen.Devices.route) { DevicesScreen(navController) }

                    composable(
                        Screen.StudentDetail.route,
                        arguments = listOf(navArgument("studentId") { type = NavType.IntType })
                    ) { entry -> StudentDetailScreen(entry.arguments?.getInt("studentId") ?: 0, navController) }
                    composable(
                        Screen.ClassDetail.route,
                        arguments = listOf(
                            navArgument("classId") { type = NavType.IntType },
                            navArgument("date") { type = NavType.StringType; defaultValue = DateUtils.today() }
                        )
                    ) { entry ->
                        ClassDetailScreen(
                            classId = entry.arguments?.getInt("classId") ?: 0,
                            initialDate = entry.arguments?.getString("date") ?: DateUtils.today(),
                            navController = navController
                        )
                    }
                    composable(
                        Screen.ReportDetail.route,
                        arguments = listOf(navArgument("attendanceId") { type = NavType.IntType })
                    ) { entry -> ReportDetailScreen(entry.arguments?.getInt("attendanceId") ?: 0, navController) }
                    composable(Screen.ChangePassword.route) { ChangePasswordScreen(navController) }
                }

                if (isBottomBarVisible) {
                    SdBottomBar(
                        navController = navController,
                        hazeState = hazeState,
                        modifier = Modifier.align(Alignment.BottomCenter)
                    )
                }
            }
        }
    }
}
