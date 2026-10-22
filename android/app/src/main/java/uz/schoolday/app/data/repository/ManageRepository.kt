package uz.schoolday.app.data.repository

import kotlinx.coroutines.CancellationException
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import uz.schoolday.app.data.remote.ApiService
import uz.schoolday.app.data.remote.dto.*
import uz.schoolday.app.util.tr
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

/** Student form values; blank texts are sent as empty (Laravel turns them into null). */
data class StudentForm(
    val name: String = "",
    val classId: Int? = null,
    val phone: String = "",
    val address: String = "",
    val telegramId: String = "",
    val status: String = "active",
    val gender: String = "unknown",
    val employeeNo: String = "",
    // Database defaults for a new student
    val userVerifyMode: String = "face",
    val localUiRight: Boolean = false,
    val doorRight: String = "1",
    val planTemplateNo: String = "1",
    val validEnabled: Boolean = false,
    val validBegin: String = "",
    val validEnd: String = ""
)

/**
 * Every create / edit / delete the web panel has. After a change to classes, shifts or branches the
 * caller reloads ScopeStore so the pickers on other screens see it.
 */
@Singleton
class ManageRepository @Inject constructor(
    private val api: ApiService,
    private val gson: Gson,
    @ApplicationContext private val context: Context
) {
    // ---- Profile & 2FA ----

    suspend fun forgotPassword(email: String) = apiAction(gson) { api.forgotPassword(EmailBody(email)) }
    suspend fun updateProfile(name: String, email: String, phone: String?) = apiAction(gson) { api.updateProfile(ProfileBody(name, email, phone)) }
    suspend fun deleteProfile(password: String) = apiAction(gson) { api.deleteProfile(PasswordBody(password)) }
    suspend fun enableTwoFactor(password: String) = apiCall(gson) { api.enableTwoFactor(PasswordBody(password)) }
    suspend fun confirmTwoFactor(code: String) = apiCall(gson) { api.confirmTwoFactor(CodeBody(code)) }
    suspend fun disableTwoFactor(password: String) = apiAction(gson) { api.disableTwoFactor(PasswordBody(password)) }
    suspend fun recoveryCodes(password: String) = apiCall(gson) { api.recoveryCodes(PasswordBody(password)) }
    suspend fun regenerateRecoveryCodes(password: String) = apiCall(gson) { api.regenerateRecoveryCodes(PasswordBody(password)) }

    // ---- Students ----

    suspend fun students(search: String?, scope: Scope, classId: Int?, status: String, page: Int) =
        pageCall(gson) { api.studentsByStatus(search?.ifBlank { null }, scope.schoolId, scope.branchId, classId, status, page) }

    /** [photo] is a prepared JPEG (see FacePhoto); null keeps the current photo on edit. */
    suspend fun saveStudent(id: Int?, form: StudentForm, photo: File?): Resource<StudentDto> {
        val fields = buildMap<String, RequestBody> {
            fun put(key: String, value: String) = put(key, value.toRequestBody(TEXT))
            put("name", form.name.trim())
            put("class_id", form.classId?.toString().orEmpty())
            put("phone", form.phone.trim())
            put("address", form.address.trim())
            put("telegram_id", form.telegramId.trim())
            put("status", form.status)
            put("gender", form.gender)
            put("employeeNoString", form.employeeNo.trim())
            put("user_verify_mode", form.userVerifyMode)
            put("local_ui_right", if (form.localUiRight) "1" else "0")
            put("door_right", form.doorRight.trim())
            put("plan_template_no", form.planTemplateNo.trim())
            put("valid_enabled", if (form.validEnabled) "1" else "0")
            put("valid_begin", form.validBegin)
            put("valid_end", form.validEnd)
        }
        val part = photo?.let { MultipartBody.Part.createFormData("face_image", it.name, it.asRequestBody("image/jpeg".toMediaType())) }
        return apiCall(gson) { if (id == null) api.createStudent(fields, part) else api.updateStudent(id, fields, part) }
    }

    suspend fun deleteStudent(id: Int) = apiAction(gson) { api.deleteStudent(id) }

    /** Downloads the Excel template into the cache for sharing / opening. */
    suspend fun studentsTemplate(): Resource<File> = download("shablon_oquvchilar.xlsx") { api.studentsTemplate() }

    /** Uploads an .xlsx/.xls/.csv picked with the system file picker; rows are added in the background. */
    suspend fun importStudents(classId: Int, uri: Uri): Resource<Unit> = withContext(Dispatchers.IO) {
        try {
            val name = context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c ->
                if (c.moveToFirst()) c.getString(0) else null
            } ?: "students.xlsx"
            val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                ?: return@withContext Resource.Error(tr("Faylni o'qib bo'lmadi"))
            val type = context.contentResolver.getType(uri) ?: "application/octet-stream"
            val part = MultipartBody.Part.createFormData("excel_file", name, bytes.toRequestBody(type.toMediaType()))
            apiAction(gson) { api.importStudents(classId.toString().toRequestBody(TEXT), part) }
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Resource.Error(tr("Faylni o'qib bo'lmadi"))
        }
    }

    // ---- Classes, shifts, branches, devices ----

    suspend fun saveClass(id: Int?, body: ClassBody) = apiCall(gson) { if (id == null) api.createClass(body) else api.updateClass(id, body) }
    suspend fun deleteClass(id: Int) = apiAction(gson) { api.deleteClass(id) }

    suspend fun shifts(scope: Scope) = apiCall(gson) { api.shifts(scope.schoolId, scope.branchId) }
    suspend fun saveShift(id: Int?, body: ShiftBody) = apiCall(gson) { if (id == null) api.createShift(body) else api.updateShift(id, body) }
    suspend fun deleteShift(id: Int) = apiAction(gson) { api.deleteShift(id) }

    suspend fun branches(schoolId: Int?, date: String?) = apiCall(gson) { api.branches(schoolId, date) }
    suspend fun branch(id: Int, date: String?) = apiCall(gson) { api.branch(id, date) }
    suspend fun saveBranch(id: Int?, body: BranchBody) = apiCall(gson) { if (id == null) api.createBranch(body) else api.updateBranch(id, body) }
    suspend fun deleteBranch(id: Int) = apiAction(gson) { api.deleteBranch(id) }

    suspend fun devices(scope: Scope, online: Boolean?, type: String?) =
        apiCall(gson) { api.devicesFiltered(scope.schoolId, scope.branchId, online?.let { if (it) 1 else 0 }, type) }
    suspend fun saveDevice(id: Int?, body: DeviceBody) = apiCall(gson) { if (id == null) api.createDevice(body) else api.updateDevice(id, body) }
    suspend fun deleteDevice(id: Int) = apiAction(gson) { api.deleteDevice(id) }

    // ---- Reports ----

    suspend fun deleteAttendance(id: Int) = apiAction(gson) { api.deleteAttendance(id) }
    suspend fun deleteEvent(id: Int) = apiAction(gson) { api.deleteEvent(id) }

    // ---- Schools ----

    suspend fun schools(search: String?, status: Int?) = apiCall(gson) { api.schools(search?.ifBlank { null }, status) }
    suspend fun school(id: Int) = apiCall(gson) { api.school(id) }
    suspend fun saveSchool(id: Int?, body: SchoolBody) = apiCall(gson) { if (id == null) api.createSchool(body) else api.updateSchool(id, body) }
    suspend fun deleteSchool(id: Int) = apiAction(gson) { api.deleteSchool(id) }
    suspend fun saveSchoolSettings(id: Int, body: SchoolSettingsBody) = apiCall(gson) { api.saveSchoolSettings(id, body) }
    suspend fun attachUser(schoolId: Int, userId: Int) = apiCall(gson) { api.attachSchoolUser(schoolId, UserIdBody(userId)) }
    suspend fun detachUser(schoolId: Int, userId: Int) = apiCall(gson) { api.detachSchoolUser(schoolId, userId) }
    suspend fun lookupUsers(query: String) = apiCall(gson) { api.lookupUsers(query) }

    // ---- Users, system ----

    suspend fun roles() = apiCall(gson) { api.roles() }
    suspend fun users(search: String?, role: String?, schoolId: Int?) = apiCall(gson) { api.users(search?.ifBlank { null }, role, schoolId) }
    suspend fun saveUser(id: Int?, body: UserBody) = apiCall(gson) { if (id == null) api.createUser(body) else api.updateUser(id, body) }
    suspend fun deleteUser(id: Int) = apiAction(gson) { api.deleteUser(id) }
    suspend fun systemSettings() = apiCall(gson) { api.systemSettings() }
    suspend fun saveSystemSettings(token: String) = apiCall(gson) { api.saveSystemSettings(SystemSettingsBody(token)) }

    private suspend fun download(fileName: String, request: suspend () -> retrofit2.Response<okhttp3.ResponseBody>): Resource<File> =
        withContext(Dispatchers.IO) {
            try {
                val response = request()
                val body = response.body()
                if (!response.isSuccessful || body == null) {
                    return@withContext Resource.Error(messageOf(errorJson(gson, response), response.code()) ?: tr("Server xatosi (%s)", response.code()))
                }
                val dir = File(context.cacheDir, "reports").apply { mkdirs() }
                val file = File(dir, fileName)
                body.byteStream().use { input -> file.outputStream().use { input.copyTo(it) } }
                Resource.Success(file)
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                Resource.Error(tr("Internetga ulanib bo'lmadi"))
            }
        }

    private companion object {
        val TEXT = "text/plain".toMediaType()
    }
}
