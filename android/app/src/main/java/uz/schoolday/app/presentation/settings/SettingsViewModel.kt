package uz.schoolday.app.presentation.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import uz.schoolday.app.data.local.SessionStore
import uz.schoolday.app.data.remote.dto.UserDto
import uz.schoolday.app.data.repository.AuthRepository
import uz.schoolday.app.data.repository.Resource
import uz.schoolday.app.util.PinCode
import uz.schoolday.app.util.tr
import javax.inject.Inject

data class SettingsUiState(
    val user: UserDto? = null,
    val language: String = "uz",
    val themeMode: String = "system",
    val isBiometricEnabled: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val passwordChanged: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val session: SessionStore
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch { session.languageFlow.collect { v -> _uiState.update { it.copy(language = v) } } }
        viewModelScope.launch { session.themeModeFlow.collect { v -> _uiState.update { it.copy(themeMode = v) } } }
        viewModelScope.launch { session.biometricEnabledFlow.collect { v -> _uiState.update { it.copy(isBiometricEnabled = v) } } }
        loadUser()
    }

    fun loadUser() {
        viewModelScope.launch {
            (auth.me() as? Resource.Success)?.data?.let { user -> _uiState.update { it.copy(user = user) } }
        }
    }

    fun setLanguage(lang: String) = viewModelScope.launch { session.setLanguage(lang) }

    fun setThemeMode(mode: String) = viewModelScope.launch { session.setThemeMode(mode) }

    /** Fingerprint login always comes with a PIN (the way in when the finger isn't read). */
    fun enableBiometric(pin: String) = viewModelScope.launch {
        session.setPinCode(PinCode.hash(pin))
        session.setBiometricEnabled(true)
    }

    fun disableBiometric() = viewModelScope.launch {
        session.setBiometricEnabled(false)
        session.setPinCode(null)
    }

    fun logout() = viewModelScope.launch { auth.logout() }

    fun changePassword(current: String, new: String, confirm: String) {
        if (current.isBlank() || new.isBlank()) {
            _uiState.update { it.copy(errorMessage = tr("Barcha maydonlarni to'ldiring")) }
            return
        }
        if (new != confirm) {
            _uiState.update { it.copy(errorMessage = tr("Yangi parollar mos emas")) }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            when (val r = auth.changePassword(current, new)) {
                is Resource.Success -> _uiState.update { it.copy(isLoading = false, passwordChanged = true) }
                is Resource.Error -> _uiState.update { it.copy(isLoading = false, errorMessage = r.message) }
            }
        }
    }
}
