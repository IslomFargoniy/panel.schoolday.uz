package uz.schoolday.app.data.remote.dto

import com.google.gson.annotations.SerializedName

// ---- Shifts, branches ----

data class ShiftDto(
    val id: Int = 0,
    val name: String = "",
    val startTime: String = "",
    val endTime: String = "",
    val branchId: Int = 0,
    val branchName: String? = null,
    val classesCount: Int = 0
)

data class BranchDto(
    val id: Int = 0,
    val name: String = "",
    val description: String? = null,
    val schoolId: Int = 0,
    val schoolName: String? = null,
    val shiftsCount: Int = 0,
    val devicesCount: Int = 0,
    val totalStudents: Int = 0,
    val presentStudents: Int = 0,
    val lateStudents: Int = 0,
    // Detail only
    val shifts: List<FilterShift> = emptyList(),
    val devices: List<DeviceDto> = emptyList(),
    val macAddresses: List<String> = emptyList()
)

// ---- Request bodies (null fields are left out by Gson) ----

data class ShiftBody(val branchId: Int, val name: String, val startTime: String, val endTime: String)

data class ClassBody(val name: String, val shiftId: Int, val telegramGroupId: String?)

data class BranchBody(val schoolId: Int?, val name: String, val description: String?, val macAddresses: List<String>)

data class DeviceBody(
    val branchId: Int,
    val connectionType: String,
    val name: String?,
    val deviceId: String?,
    val macAddress: String?,
    val encryptionKey: String?,
    /** Edit: a blank key field keeps the stored key. */
    val keepEncryptionKey: Boolean? = null,
    val status: Boolean? = null
)

data class ProfileBody(val name: String, val email: String, val phone: String?)

data class PasswordBody(val password: String)

data class CodeBody(val code: String)

data class EmailBody(val email: String)

// ---- 2FA ----

data class TwoFactorSetup(val secret: String = "", val otpauthUrl: String = "")

data class RecoveryCodes(val recoveryCodes: List<String> = emptyList())

// ---- Admin: schools ----

data class SchoolDto(
    val id: Int = 0,
    val name: String = "",
    val address: String? = null,
    val comment: String? = null,
    val branchLimit: Int? = null,
    val branchPrice: Double? = null,
    val validDate: String? = null,
    val status: Int = 1,
    val branchesCount: Int = 0,
    val settings: SchoolSettingsDto = SchoolSettingsDto(),
    val users: List<UserBrief> = emptyList()
)

data class SchoolSettingsDto(
    val telegramChannelId: String? = null,
    val timezone: String? = null,
    val smsSender: String? = null,
    val webhookUrl: String? = null
)

data class SchoolBody(
    val name: String,
    val address: String?,
    val comment: String?,
    val branchLimit: Int,
    val branchPrice: Double?,
    val validDate: String?,
    val status: Int
)

data class SchoolSettingsBody(
    val schoolId: Int,
    val telegramChannelId: String?,
    val timezone: String?,
    val smsSender: String?,
    val webhookUrl: String?
)

data class UserBrief(val id: Int = 0, val name: String = "", val email: String? = null, val phone: String? = null)

data class UserIdBody(val userId: Int)

// ---- Superadmin: users, system settings ----

data class AdminUserDto(
    val id: Int = 0,
    val name: String = "",
    val email: String? = null,
    val phone: String? = null,
    val role: String? = null,
    val twoFactorEnabled: Boolean = false,
    val schools: List<SchoolBrief> = emptyList()
)

data class SchoolBrief(val id: Int = 0, val name: String = "")

data class UserBody(val name: String, val email: String, val phone: String?, val password: String?, val role: String)

data class SystemSettingsDto(val telegramBotTokenSet: Boolean = false, val telegramBotTokenMasked: String? = null)

data class SystemSettingsBody(@SerializedName("telegram_bot_token") val telegramBotToken: String)
