package uz.schoolday.app.presentation.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import uz.schoolday.app.data.remote.dto.Permissions
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.initials
import uz.schoolday.app.util.tr

/** One entry of the left drawer. */
data class DrawerEntry(val route: String, val title: String, val icon: ImageVector, val tint: Color, val bg: Color)

data class DrawerGroup(val title: String, val entries: List<DrawerEntry>)

/** Drawer groups; "Boshqaruv" and "Tizim" only for the roles that may use them (the server checks too). */
@Composable
fun drawerGroups(permissions: Permissions?): List<DrawerGroup> {
    val c = SchoolDayTheme.colors
    val groups = mutableListOf(
        DrawerGroup(tr("Davomat"), listOf(
            DrawerEntry(Screen.Monitoring.route, tr("Monitoring"), Icons.Outlined.Sensors, c.success, c.successBg),
            DrawerEntry(Screen.Reports.route, tr("Hisobotlar"), Icons.Outlined.Assessment, c.accentText, c.indigoBg)
        )),
        DrawerGroup(tr("Maktab"), listOf(
            DrawerEntry(Screen.Students.route, tr("O'quvchilar"), Icons.Outlined.People, c.accentText, c.indigoBg),
            DrawerEntry(Screen.Classes.route, tr("Sinflar"), Icons.Outlined.Class, c.warning, c.warningBg),
            DrawerEntry(Screen.Shifts.route, tr("Smenalar"), Icons.Outlined.Schedule, c.success, c.successBg),
            DrawerEntry(Screen.Branches.route, tr("Filiallar"), Icons.Outlined.Store, c.accentText, c.indigoBg),
            DrawerEntry(Screen.Devices.route, tr("Qurilmalar"), Icons.Outlined.Router, c.danger, c.dangerBg)
        ))
    )
    if (permissions?.manageSchools == true) {
        groups += DrawerGroup(tr("Boshqaruv"), listOf(
            DrawerEntry(Screen.Schools.route, tr("Maktablar"), Icons.Outlined.School, c.accentText, c.indigoBg)
        ))
    }
    if (permissions?.manageUsers == true || permissions?.systemSettings == true) {
        groups += DrawerGroup(tr("Tizim"), listOfNotNull(
            DrawerEntry(Screen.Users.route, tr("Foydalanuvchilar"), Icons.Outlined.ManageAccounts, c.warning, c.warningBg).takeIf { permissions.manageUsers },
            DrawerEntry(Screen.SystemSettings.route, tr("Tizim sozlamalari"), Icons.Outlined.Tune, c.danger, c.dangerBg).takeIf { permissions.systemSettings }
        ))
    }
    return groups
}

@Composable
fun AppDrawer(
    userName: String,
    subtitle: String,
    groups: List<DrawerGroup>,
    currentRoute: String?,
    onOpen: (String) -> Unit
) {
    val c = SchoolDayTheme.colors
    ModalDrawerSheet(
        drawerContainerColor = MaterialTheme.colorScheme.background,
        drawerShape = RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp),
        modifier = Modifier.width(300.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 14.dp, vertical = 18.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 6.dp, vertical = 8.dp)) {
                Box(
                    modifier = Modifier.size(46.dp).clip(CircleShape).background(c.surface2).border(1.dp, c.borderStrong, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(initials(userName), color = c.accentText, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(userName, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            HorizontalDivider(color = c.border, modifier = Modifier.padding(vertical = 8.dp))
            groups.forEach { group ->
                Text(
                    group.title.uppercase(),
                    style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 0.8.sp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(start = 8.dp, top = 12.dp, bottom = 4.dp)
                )
                group.entries.forEach { e ->
                    val on = e.route == currentRoute
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (on) c.indigoBg else Color.Transparent)
                            .clickable { onOpen(e.route) }
                            .padding(horizontal = 8.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(Modifier.size(34.dp).clip(RoundedCornerShape(10.dp)).background(e.bg), contentAlignment = Alignment.Center) {
                            Icon(e.icon, null, tint = e.tint, modifier = Modifier.size(19.dp))
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(
                            e.title,
                            style = MaterialTheme.typography.bodyLarge.copy(fontWeight = if (on) FontWeight.Bold else FontWeight.Medium),
                            color = if (on) c.accentText else MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}
