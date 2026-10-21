package uz.schoolday.app.data.repository

import android.content.Context
import com.google.gson.Gson
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import uz.schoolday.app.data.remote.ApiService
import uz.schoolday.app.data.remote.dto.*
import uz.schoolday.app.util.tr
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

/** Report filters; null/blank values are left out of the query. */
data class ReportQuery(
    val startDate: String,
    val endDate: String,
    val status: String = "all",
    val schoolId: Int? = null,
    val branchId: Int? = null,
    val classId: Int? = null,
    val studentId: Int? = null
) {
    fun toMap(): Map<String, String> = buildMap {
        put("start_date", startDate)
        put("end_date", endDate)
        put("status", status)
        schoolId?.let { put("school_id", it.toString()) }
        branchId?.let { put("branch_id", it.toString()) }
        classId?.let { put("class_id", it.toString()) }
        studentId?.let { put("student_id", it.toString()) }
    }
}

@Singleton
class SchoolRepository @Inject constructor(
    private val api: ApiService,
    private val gson: Gson,
    @ApplicationContext private val context: Context
) {
    suspend fun filters() = apiCall(gson) { api.filters() }

    suspend fun dashboard(date: String, schoolId: Int?, branchId: Int?) =
        apiCall(gson) { api.dashboard(date, schoolId, branchId) }

    suspend fun monitoring(date: String, schoolId: Int?, branchId: Int?) =
        apiCall(gson) { api.monitoring(date, schoolId, branchId) }

    suspend fun classes(date: String, schoolId: Int?, branchId: Int?) =
        apiCall(gson) { api.classes(date, schoolId, branchId) }

    suspend fun classDetail(id: Int, date: String) = apiCall(gson) { api.classDetail(id, date) }

    suspend fun students(search: String?, schoolId: Int?, branchId: Int?, classId: Int?, page: Int) =
        pageCall(gson) { api.students(search?.ifBlank { null }, schoolId, branchId, classId, page) }

    suspend fun student(id: Int, month: String) = apiCall(gson) { api.student(id, month) }

    suspend fun studentEvents(id: Int) = apiCall(gson) { api.studentEvents(id) }

    suspend fun reports(query: ReportQuery, page: Int) = pageCall(gson) { api.reports(query.toMap(), page) }

    suspend fun report(id: Int) = apiCall(gson) { api.report(id) }

    suspend fun devices(schoolId: Int?, branchId: Int?) = apiCall(gson) { api.devices(schoolId, branchId) }

    /** Downloads the report as .xlsx into the app cache; the file is then shared via FileProvider. */
    suspend fun exportReport(query: ReportQuery): Resource<File> = withContext(Dispatchers.IO) {
        try {
            val response = api.exportReport(query.toMap())
            val body = response.body()
            if (!response.isSuccessful || body == null) {
                return@withContext Resource.Error(messageOf(errorJson(gson, response), response.code()) ?: tr("Server xatosi (%s)", response.code()))
            }
            val dir = File(context.cacheDir, "reports").apply { mkdirs() }
            val file = File(dir, "davomat_${query.startDate}_${query.endDate}.xlsx")
            body.byteStream().use { input -> file.outputStream().use { input.copyTo(it) } }
            Resource.Success(file)
        } catch (e: Exception) {
            Resource.Error(tr("Internetga ulanib bo'lmadi"))
        }
    }
}
