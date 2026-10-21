package uz.schoolday.app.data.local

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "schoolday_prefs")

/** Token, the signed-in user's name and the app settings, kept on the phone. */
@Singleton
class SessionStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        private val KEY_TOKEN = stringPreferencesKey("auth_token")
        private val KEY_USER_NAME = stringPreferencesKey("user_name")
        private val KEY_LANGUAGE = stringPreferencesKey("app_language")
        private val KEY_THEME = stringPreferencesKey("app_theme_mode") // "system", "light", "dark"
        private val KEY_BIOMETRIC_ENABLED = booleanPreferencesKey("biometric_enabled")
        private val KEY_PIN_CODE = stringPreferencesKey("pin_code")
        private val KEY_BASE_URL = stringPreferencesKey("base_url")

        const val DEFAULT_BASE_URL = "https://panel.schoolday.uz/api/"
    }

    val tokenFlow: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val userNameFlow: Flow<String?> = context.dataStore.data.map { it[KEY_USER_NAME] }
    val languageFlow: Flow<String> = context.dataStore.data.map { it[KEY_LANGUAGE] ?: "uz" }
    val themeModeFlow: Flow<String> = context.dataStore.data.map { it[KEY_THEME] ?: "system" }
    val biometricEnabledFlow: Flow<Boolean> = context.dataStore.data.map { it[KEY_BIOMETRIC_ENABLED] ?: false }
    val pinCodeFlow: Flow<String?> = context.dataStore.data.map { it[KEY_PIN_CODE] }
    val baseUrlFlow: Flow<String> = context.dataStore.data.map { it[KEY_BASE_URL] ?: DEFAULT_BASE_URL }

    suspend fun saveSession(token: String, userName: String) {
        context.dataStore.edit {
            it[KEY_TOKEN] = token
            it[KEY_USER_NAME] = userName
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit {
            it.remove(KEY_TOKEN)
            it.remove(KEY_USER_NAME)
            // The lock belongs to this account: the next person must not meet someone else's PIN
            it.remove(KEY_BIOMETRIC_ENABLED)
            it.remove(KEY_PIN_CODE)
        }
    }

    suspend fun setLanguage(language: String) {
        context.dataStore.edit { it[KEY_LANGUAGE] = language }
    }

    suspend fun setThemeMode(mode: String) {
        context.dataStore.edit { it[KEY_THEME] = mode }
    }

    suspend fun setBiometricEnabled(enabled: Boolean) {
        context.dataStore.edit { it[KEY_BIOMETRIC_ENABLED] = enabled }
    }

    suspend fun setPinCode(pin: String?) {
        context.dataStore.edit { if (pin != null) it[KEY_PIN_CODE] = pin else it.remove(KEY_PIN_CODE) }
    }

    /** "panel.example.uz" / "https://host" / "https://host/api" → "https://host/api/". */
    suspend fun setBaseUrl(url: String) {
        var u = url.trim().ifBlank { DEFAULT_BASE_URL }
        if (!u.startsWith("http://") && !u.startsWith("https://")) u = "https://$u"
        if (!u.endsWith("/")) u += "/"
        if (!u.endsWith("/api/")) u += "api/"
        context.dataStore.edit { it[KEY_BASE_URL] = u }
    }
}
