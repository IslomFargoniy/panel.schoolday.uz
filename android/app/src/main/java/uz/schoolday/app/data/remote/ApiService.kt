package uz.schoolday.app.data.remote

import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*
import uz.schoolday.app.data.remote.dto.*

interface ApiService {

    // ---- Auth ----

    @POST("v1/auth/login")
    suspend fun login(@Body body: LoginRequest): Response<ApiResponse<LoginData>>

    @GET("v1/auth/me")
    suspend fun me(): Response<ApiResponse<UserDto>>

    @POST("v1/auth/logout")
    suspend fun logout(): Response<ApiResponse<Any>>

    @POST("v1/auth/change-password")
    suspend fun changePassword(@Body body: ChangePasswordRequest): Response<ApiResponse<Any>>

    // ---- Data ----

    @GET("v1/filters")
    suspend fun filters(): Response<ApiResponse<List<FilterSchool>>>

    @GET("v1/dashboard")
    suspend fun dashboard(
        @Query("date") date: String?,
        @Query("school_id") schoolId: Int?,
        @Query("branch_id") branchId: Int?,
        @Query("days") days: Int = 7
    ): Response<ApiResponse<DashboardDto>>

    @GET("v1/monitoring")
    suspend fun monitoring(
        @Query("date") date: String?,
        @Query("school_id") schoolId: Int?,
        @Query("branch_id") branchId: Int?
    ): Response<ApiResponse<MonitoringDto>>

    @GET("v1/classes")
    suspend fun classes(
        @Query("date") date: String?,
        @Query("school_id") schoolId: Int?,
        @Query("branch_id") branchId: Int?,
        @Query("search") search: String? = null
    ): Response<ApiResponse<List<ClassDto>>>

    @GET("v1/classes/{id}")
    suspend fun classDetail(@Path("id") id: Int, @Query("date") date: String?): Response<ApiResponse<ClassDetailDto>>

    @GET("v1/students")
    suspend fun students(
        @Query("search") search: String?,
        @Query("school_id") schoolId: Int?,
        @Query("branch_id") branchId: Int?,
        @Query("class_id") classId: Int?,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 30
    ): Response<ApiResponse<List<StudentDto>>>

    @GET("v1/students/{id}")
    suspend fun student(@Path("id") id: Int, @Query("month") month: String?): Response<ApiResponse<StudentDetailDto>>

    @GET("v1/students/{id}/events")
    suspend fun studentEvents(@Path("id") id: Int): Response<ApiResponse<List<EventDto>>>

    @GET("v1/reports")
    suspend fun reports(@QueryMap filters: Map<String, String>, @Query("page") page: Int, @Query("per_page") perPage: Int = 30): Response<ApiResponse<List<AttendanceDto>>>

    @GET("v1/reports/{id}")
    suspend fun report(@Path("id") id: Int): Response<ApiResponse<AttendanceDto>>

    @Streaming
    @GET("v1/reports/export")
    suspend fun exportReport(@QueryMap filters: Map<String, String>): Response<ResponseBody>

    @GET("v1/devices")
    suspend fun devices(@Query("school_id") schoolId: Int?, @Query("branch_id") branchId: Int?): Response<ApiResponse<List<DeviceDto>>>
}
