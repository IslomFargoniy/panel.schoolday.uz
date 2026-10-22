package uz.schoolday.app.data.remote

import okhttp3.MultipartBody
import okhttp3.RequestBody
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

    // ---- Profile & 2FA ----

    @POST("v1/auth/forgot-password")
    suspend fun forgotPassword(@Body body: EmailBody): Response<ApiResponse<Any>>

    @PUT("v1/auth/profile")
    suspend fun updateProfile(@Body body: ProfileBody): Response<ApiResponse<Any>>

    @HTTP(method = "DELETE", path = "v1/auth/profile", hasBody = true)
    suspend fun deleteProfile(@Body body: PasswordBody): Response<ApiResponse<Any>>

    @POST("v1/auth/two-factor/enable")
    suspend fun enableTwoFactor(@Body body: PasswordBody): Response<ApiResponse<TwoFactorSetup>>

    @POST("v1/auth/two-factor/confirm")
    suspend fun confirmTwoFactor(@Body body: CodeBody): Response<ApiResponse<RecoveryCodes>>

    @POST("v1/auth/two-factor/disable")
    suspend fun disableTwoFactor(@Body body: PasswordBody): Response<ApiResponse<Any>>

    @POST("v1/auth/two-factor/recovery-codes")
    suspend fun recoveryCodes(@Body body: PasswordBody): Response<ApiResponse<RecoveryCodes>>

    @POST("v1/auth/two-factor/recovery-codes/regenerate")
    suspend fun regenerateRecoveryCodes(@Body body: PasswordBody): Response<ApiResponse<RecoveryCodes>>

    // ---- Students (multipart: the face photo) ----

    @Multipart
    @POST("v1/students")
    suspend fun createStudent(@PartMap fields: Map<String, @JvmSuppressWildcards RequestBody>, @Part photo: MultipartBody.Part?): Response<ApiResponse<StudentDto>>

    @Multipart
    @POST("v1/students/{id}")
    suspend fun updateStudent(@Path("id") id: Int, @PartMap fields: Map<String, @JvmSuppressWildcards RequestBody>, @Part photo: MultipartBody.Part?): Response<ApiResponse<StudentDto>>

    @DELETE("v1/students/{id}")
    suspend fun deleteStudent(@Path("id") id: Int): Response<ApiResponse<Any>>

    @Streaming
    @GET("v1/students/template")
    suspend fun studentsTemplate(): Response<ResponseBody>

    @Multipart
    @POST("v1/students/import")
    suspend fun importStudents(@Part("class_id") classId: RequestBody, @Part file: MultipartBody.Part): Response<ApiResponse<Any>>

    @GET("v1/students")
    suspend fun studentsByStatus(
        @Query("search") search: String?,
        @Query("school_id") schoolId: Int?,
        @Query("branch_id") branchId: Int?,
        @Query("class_id") classId: Int?,
        @Query("status") status: String,
        @Query("page") page: Int,
        @Query("per_page") perPage: Int = 30
    ): Response<ApiResponse<List<StudentDto>>>

    // ---- Classes, shifts, branches, devices ----

    @POST("v1/classes")
    suspend fun createClass(@Body body: ClassBody): Response<ApiResponse<ClassDto>>

    @PUT("v1/classes/{id}")
    suspend fun updateClass(@Path("id") id: Int, @Body body: ClassBody): Response<ApiResponse<ClassDto>>

    @DELETE("v1/classes/{id}")
    suspend fun deleteClass(@Path("id") id: Int): Response<ApiResponse<Any>>

    @GET("v1/shifts")
    suspend fun shifts(@Query("school_id") schoolId: Int?, @Query("branch_id") branchId: Int?): Response<ApiResponse<List<ShiftDto>>>

    @POST("v1/shifts")
    suspend fun createShift(@Body body: ShiftBody): Response<ApiResponse<ShiftDto>>

    @PUT("v1/shifts/{id}")
    suspend fun updateShift(@Path("id") id: Int, @Body body: ShiftBody): Response<ApiResponse<ShiftDto>>

    @DELETE("v1/shifts/{id}")
    suspend fun deleteShift(@Path("id") id: Int): Response<ApiResponse<Any>>

    @GET("v1/branches")
    suspend fun branches(@Query("school_id") schoolId: Int?, @Query("date") date: String?): Response<ApiResponse<List<BranchDto>>>

    @GET("v1/branches/{id}")
    suspend fun branch(@Path("id") id: Int, @Query("date") date: String?): Response<ApiResponse<BranchDto>>

    @POST("v1/branches")
    suspend fun createBranch(@Body body: BranchBody): Response<ApiResponse<BranchDto>>

    @PUT("v1/branches/{id}")
    suspend fun updateBranch(@Path("id") id: Int, @Body body: BranchBody): Response<ApiResponse<BranchDto>>

    @DELETE("v1/branches/{id}")
    suspend fun deleteBranch(@Path("id") id: Int): Response<ApiResponse<Any>>

    @GET("v1/devices")
    suspend fun devicesFiltered(
        @Query("school_id") schoolId: Int?,
        @Query("branch_id") branchId: Int?,
        @Query("is_online") isOnline: Int?,
        @Query("connection_type") connectionType: String?
    ): Response<ApiResponse<List<DeviceDto>>>

    @POST("v1/devices")
    suspend fun createDevice(@Body body: DeviceBody): Response<ApiResponse<DeviceDto>>

    @PUT("v1/devices/{id}")
    suspend fun updateDevice(@Path("id") id: Int, @Body body: DeviceBody): Response<ApiResponse<DeviceDto>>

    @DELETE("v1/devices/{id}")
    suspend fun deleteDevice(@Path("id") id: Int): Response<ApiResponse<Any>>

    // ---- Reports ----

    @DELETE("v1/reports/{id}")
    suspend fun deleteAttendance(@Path("id") id: Int): Response<ApiResponse<Any>>

    @DELETE("v1/report-events/{id}")
    suspend fun deleteEvent(@Path("id") id: Int): Response<ApiResponse<Any>>

    // ---- Schools (Admin / Superadmin manage; everyone reads their own) ----

    @GET("v1/schools")
    suspend fun schools(@Query("search") search: String?, @Query("status") status: Int?): Response<ApiResponse<List<SchoolDto>>>

    @GET("v1/schools/{id}")
    suspend fun school(@Path("id") id: Int): Response<ApiResponse<SchoolDto>>

    @POST("v1/schools")
    suspend fun createSchool(@Body body: SchoolBody): Response<ApiResponse<SchoolDto>>

    @PUT("v1/schools/{id}")
    suspend fun updateSchool(@Path("id") id: Int, @Body body: SchoolBody): Response<ApiResponse<SchoolDto>>

    @DELETE("v1/schools/{id}")
    suspend fun deleteSchool(@Path("id") id: Int): Response<ApiResponse<Any>>

    @PUT("v1/schools/{id}/settings")
    suspend fun saveSchoolSettings(@Path("id") id: Int, @Body body: SchoolSettingsBody): Response<ApiResponse<SchoolDto>>

    @POST("v1/schools/{id}/users")
    suspend fun attachSchoolUser(@Path("id") id: Int, @Body body: UserIdBody): Response<ApiResponse<SchoolDto>>

    @DELETE("v1/schools/{id}/users/{userId}")
    suspend fun detachSchoolUser(@Path("id") id: Int, @Path("userId") userId: Int): Response<ApiResponse<SchoolDto>>

    @GET("v1/users/lookup")
    suspend fun lookupUsers(@Query("q") query: String): Response<ApiResponse<List<UserBrief>>>

    // ---- Superadmin ----

    @GET("v1/roles")
    suspend fun roles(): Response<ApiResponse<List<String>>>

    @GET("v1/users")
    suspend fun users(@Query("search") search: String?, @Query("role") role: String?, @Query("school_id") schoolId: Int?): Response<ApiResponse<List<AdminUserDto>>>

    @POST("v1/users")
    suspend fun createUser(@Body body: UserBody): Response<ApiResponse<AdminUserDto>>

    @PUT("v1/users/{id}")
    suspend fun updateUser(@Path("id") id: Int, @Body body: UserBody): Response<ApiResponse<AdminUserDto>>

    @DELETE("v1/users/{id}")
    suspend fun deleteUser(@Path("id") id: Int): Response<ApiResponse<Any>>

    @GET("v1/system-settings")
    suspend fun systemSettings(): Response<ApiResponse<SystemSettingsDto>>

    @PUT("v1/system-settings")
    suspend fun saveSystemSettings(@Body body: SystemSettingsBody): Response<ApiResponse<SystemSettingsDto>>
}
