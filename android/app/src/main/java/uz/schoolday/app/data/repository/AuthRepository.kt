package uz.schoolday.app.data.repository

import com.google.gson.Gson
import kotlinx.coroutines.flow.Flow
import uz.schoolday.app.data.local.SessionStore
import uz.schoolday.app.data.remote.ApiService
import uz.schoolday.app.data.remote.dto.ChangePasswordRequest
import uz.schoolday.app.data.remote.dto.LoginRequest
import uz.schoolday.app.data.remote.dto.UserDto
import uz.schoolday.app.util.tr
import javax.inject.Inject
import javax.inject.Singleton

sealed class LoginResult {
    data class Success(val user: UserDto) : LoginResult()
    /** 2FA is on for this account: ask for the code (and say so when [message] is set). */
    data class NeedsCode(val message: String?) : LoginResult()
    data class Error(val message: String) : LoginResult()
}

@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val session: SessionStore,
    private val gson: Gson
) {
    val baseUrl: Flow<String> = session.baseUrlFlow

    suspend fun setBaseUrl(url: String) = session.setBaseUrl(url)

    suspend fun login(login: String, password: String, code: String?, recoveryCode: String?): LoginResult = try {
        val response = api.login(LoginRequest(login = login, password = password, code = code, recoveryCode = recoveryCode))
        val body = response.body()
        if (response.isSuccessful && body?.success == true && body.data != null) {
            session.saveSession(body.data.token, body.data.user.name)
            LoginResult.Success(body.data.user)
        } else {
            val json = errorJson(gson, response)
            val message = messageOf(json, response.code())
            if (json?.get("two_factor_required")?.asBoolean == true) {
                // The first answer only says a code is needed; a later one means the code was wrong
                LoginResult.NeedsCode(if (code != null || recoveryCode != null) message else null)
            } else {
                LoginResult.Error(message ?: tr("Kirishda xatolik yuz berdi"))
            }
        }
    } catch (e: Exception) {
        LoginResult.Error(tr("Internetga ulanib bo'lmadi"))
    }

    suspend fun me(): Resource<UserDto> = apiCall(gson) { api.me() }

    suspend fun changePassword(current: String, new: String): Resource<Unit> =
        apiAction(gson) { api.changePassword(ChangePasswordRequest(current, new, new)) }

    /** Revokes the token on the server (best effort) and forgets it here. */
    suspend fun logout() {
        try { api.logout() } catch (_: Exception) {}
        session.clearSession()
    }
}
