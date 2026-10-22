package uz.schoolday.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// Gson reads snake_case JSON into these camelCase fields (FieldNamingPolicy in NetworkModule).
// Every field has a default so Gson uses the no-arg constructor and a missing key never becomes null.

data class ApiResponse<T>(
    val success: Boolean = false,
    val data: T? = null,
    val message: String? = null,
    val meta: PageMeta? = null
)

data class PageMeta(
    val currentPage: Int = 1,
    val lastPage: Int = 1,
    val perPage: Int = 20,
    val total: Int = 0,
    val rangeTruncated: Boolean = false,
    val effectiveEndDate: String? = null
)

data class Page<T>(val items: List<T>, val meta: PageMeta)

// ---- Auth ----

data class LoginRequest(
    val login: String,
    val password: String,
    val deviceName: String = "android",
    val code: String? = null,
    val recoveryCode: String? = null
)

data class LoginData(val token: String = "", val user: UserDto = UserDto())

data class UserDto(
    val id: Int = 0,
    val name: String = "",
    val email: String? = null,
    val phone: String? = null,
    val roles: List<String> = emptyList(),
    val isGlobalAdmin: Boolean = false,
    val twoFactorEnabled: Boolean = false,
    val schools: List<SchoolRef> = emptyList(),
    val permissions: Permissions = Permissions()
)

/** Which menus the app shows; the server checks every request anyway. */
data class Permissions(
    val manageSchools: Boolean = false,
    val manageUsers: Boolean = false,
    val systemSettings: Boolean = false
)

data class SchoolRef(
    val id: Int = 0,
    val name: String = "",
    val isActive: Boolean = true,
    val validDate: String? = null
)

data class ChangePasswordRequest(
    val currentPassword: String,
    val password: String,
    val passwordConfirmation: String
)

// ---- Filters: school → branch → shift → class ----

data class FilterSchool(val id: Int = 0, val name: String = "", val branches: List<FilterBranch> = emptyList())
data class FilterBranch(val id: Int = 0, val name: String = "", val shifts: List<FilterShift> = emptyList())
data class FilterShift(
    val id: Int = 0,
    val name: String = "",
    val startTime: String? = null,
    val endTime: String? = null,
    val classes: List<FilterClass> = emptyList()
)
data class FilterClass(val id: Int = 0, val name: String = "")

// ---- Dashboard ----

data class DashboardDto(
    val date: String = "",
    val stats: DayStats = DayStats(),
    val trend: List<TrendDay> = emptyList(),
    val recentEvents: List<EventDto> = emptyList()
)

data class DayStats(
    val totalStudents: Int = 0,
    val present: Int = 0,
    val late: Int = 0,
    val onTime: Int = 0,
    val absent: Int = 0,
    val leftEarly: Int = 0
)

data class TrendDay(
    val date: String = "",
    val present: Int = 0,
    val late: Int = 0,
    val onTime: Int = 0,
    val absent: Int = 0
)

/** One face scan on a terminal. [picture] is an absolute URL or null. */
data class EventDto(
    val id: Int = 0,
    val time: String? = null,
    val deviceName: String? = null,
    val name: String? = null,
    val employeeNo: String? = null,
    val picture: String? = null,
    val studentId: Int? = null,
    val className: String? = null
)

// ---- Monitoring ----

data class MonitoringDto(
    val date: String = "",
    val updatedAt: String = "",
    val branches: List<MonitoringBranch> = emptyList()
)

data class MonitoringBranch(
    val id: Int = 0,
    val name: String = "",
    val total: Int = 0,
    val present: Int = 0,
    val late: Int = 0,
    val classes: List<MonitoringClass> = emptyList()
)

data class MonitoringClass(
    val id: Int = 0,
    val name: String = "",
    val shiftId: Int = 0,
    val shiftName: String? = null,
    val total: Int = 0,
    val present: Int = 0,
    val late: Int = 0,
    val students: List<MonitoringStudent> = emptyList()
)

/** [status] is "on_time", "late" or "absent". */
data class MonitoringStudent(
    val id: Int = 0,
    val name: String = "",
    val status: String = "absent",
    val firstCheckIn: String? = null,
    val lastCheckOut: String? = null
)

// ---- Students, attendance ----

data class StudentDto(
    val id: Int = 0,
    val name: String = "",
    val phone: String? = null,
    val employeeNo: String? = null,
    val status: String? = null,
    val gender: String? = null,
    val faceImage: String? = null,
    val telegramLinked: Boolean = false,
    val classId: Int? = null,
    val className: String? = null,
    val shiftId: Int? = null,
    val shiftName: String? = null,
    val branchId: Int? = null,
    val branchName: String? = null,
    // Edit form fields
    val address: String? = null,
    val telegramId: String? = null,
    val userVerifyMode: String? = null,
    val localUiRight: Boolean = false,
    val doorRight: String? = null,
    val planTemplateNo: String? = null,
    val validEnabled: Boolean = false,
    val validBegin: String? = null,
    val validEnd: String? = null,
    /** Only in a class's student list: that day's attendance, null = absent. */
    val attendance: AttendanceDto? = null
)

/** One day of one student. [id] is null for "absent" rows (they are not stored). [status]: on_time / late / absent. */
data class AttendanceDto(
    val id: Int? = null,
    val date: String = "",
    val status: String = "absent",
    val firstCheckIn: String? = null,
    val lastCheckOut: String? = null,
    val isLate: Boolean = false,
    val isLeftEarly: Boolean = false,
    val startTime: String? = null,
    val endTime: String? = null,
    val student: StudentDto? = null,
    val events: List<EventDto> = emptyList()
)

data class StudentDetailDto(
    val student: StudentDto = StudentDto(),
    val month: String = "",
    val summary: MonthSummary = MonthSummary(),
    val attendances: List<AttendanceDto> = emptyList()
)

data class MonthSummary(val present: Int = 0, val late: Int = 0, val leftEarly: Int = 0)

// ---- Classes ----

data class ClassDto(
    val id: Int = 0,
    val name: String = "",
    val shiftId: Int? = null,
    val shiftName: String? = null,
    val branchName: String? = null,
    val telegramLinked: Boolean = false,
    val telegramGroupId: String? = null,
    val branchId: Int? = null,
    val totalStudents: Int = 0,
    val presentStudents: Int = 0,
    val onTimeStudents: Int = 0,
    val lateStudents: Int = 0,
    val absentStudents: Int = 0
)

data class ClassDetailDto(
    @SerializedName("class") val schoolClass: ClassDto = ClassDto(),
    val date: String = "",
    val students: List<StudentDto> = emptyList()
)

// ---- Devices ----

data class DeviceDto(
    val id: Int = 0,
    val name: String? = null,
    val deviceId: String? = null,
    val macAddress: String? = null,
    val connectionType: String? = null,
    val status: Boolean = true,
    val isOnline: Boolean = false,
    val hasEncryptionKey: Boolean = false,
    val lastSeenAt: String? = null,
    val branchId: Int? = null,
    val branchName: String? = null,
    val schoolName: String? = null
)
