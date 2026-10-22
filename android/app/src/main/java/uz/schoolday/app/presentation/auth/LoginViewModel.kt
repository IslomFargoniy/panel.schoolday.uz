package uz.schoolday.app.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uz.schoolday.app.data.repository.AuthRepository
import uz.schoolday.app.data.repository.LoginResult
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class LoginUiState(
    val login: String = "",
    val password: String = "",
    /** Second step: the account has 2FA, a 6-digit code (or a recovery code) is asked. */
    val needsCode: Boolean = false,
    val useRecoveryCode: Boolean = false,
    val code: String = "",
    val baseUrl: String = "",
    val forgotMessage: String? = null,
    val sendingReset: Boolean = false,
    val showServerConfig: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

/** Signing in only saves the token; MainActivity sees it and opens the app. */
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val manage: uz.schoolday.app.data.repository.ManageRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            auth.baseUrl.firstOrNull()?.let { url -> _uiState.update { it.copy(baseUrl = url) } }
        }
    }

    fun onLoginChanged(v: String) = _uiState.update { it.copy(login = v, errorMessage = null) }
    fun onPasswordChanged(v: String) = _uiState.update { it.copy(password = v, errorMessage = null) }
    fun onCodeChanged(v: String) = _uiState.update {
        it.copy(code = if (it.useRecoveryCode) v.trim() else v.filter(Char::isDigit).take(6), errorMessage = null)
    }
    /** Emails a reset link (the link opens the web panel's reset page). */
    fun sendReset(email: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(sendingReset = true, forgotMessage = null) }
            if (_uiState.value.baseUrl.isNotBlank()) auth.setBaseUrl(_uiState.value.baseUrl)
            val r = manage.forgotPassword(email.trim())
            _uiState.update {
                it.copy(
                    sendingReset = false,
                    forgotMessage = if (r is uz.schoolday.app.data.repository.Resource.Success) tr("Agar bu email ro'yxatdan o'tgan bo'lsa, parolni tiklash havolasi yuborildi.") else r.message
                )
            }
        }
    }

    fun clearForgot() = _uiState.update { it.copy(forgotMessage = null) }

    fun onBaseUrlChanged(v: String) = _uiState.update { it.copy(baseUrl = v) }
    fun toggleServerConfig() = _uiState.update { it.copy(showServerConfig = !it.showServerConfig) }
    fun toggleRecoveryCode() = _uiState.update { it.copy(useRecoveryCode = !it.useRecoveryCode, code = "", errorMessage = null) }

    /** Back from the code step to login and password. */
    fun cancelCode() = _uiState.update { it.copy(needsCode = false, code = "", useRecoveryCode = false, errorMessage = null) }

    fun submit() {
        val s = _uiState.value
        if (s.login.isBlank() || s.password.isBlank()) {
            _uiState.update { it.copy(errorMessage = tr("Login va parolni kiriting")) }
            return
        }
        if (s.needsCode && s.code.isBlank()) {
            _uiState.update { it.copy(errorMessage = tr("Tasdiqlash kodini kiriting")) }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            if (s.baseUrl.isNotBlank()) auth.setBaseUrl(s.baseUrl)
            val code = s.code.takeIf { s.needsCode && !s.useRecoveryCode }
            val recovery = s.code.takeIf { s.needsCode && s.useRecoveryCode }
            when (val r = auth.login(s.login.trim(), s.password, code, recovery)) {
                is LoginResult.Success -> _uiState.update { it.copy(isLoading = false) }
                is LoginResult.NeedsCode -> _uiState.update { it.copy(isLoading = false, needsCode = true, errorMessage = r.message) }
                is LoginResult.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}
