package uz.schoolday.app

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.fragment.app.FragmentActivity
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import uz.schoolday.app.data.local.SessionStore
import uz.schoolday.app.data.repository.ScopeStore
import uz.schoolday.app.presentation.auth.BiometricLockScreen
import uz.schoolday.app.presentation.auth.LoginScreen
import uz.schoolday.app.presentation.navigation.MainNavGraph
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.I18n
import uz.schoolday.app.util.PinCode
import javax.inject.Inject

// FragmentActivity (still a ComponentActivity) because BiometricPrompt needs one.
@AndroidEntryPoint
class MainActivity : FragmentActivity() {

    @Inject
    lateinit var session: SessionStore

    @Inject
    lateinit var scopeStore: ScopeStore

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            // null = not read from DataStore yet. Waiting for it keeps the login screen
            // (and the wrong theme) from flashing before the saved session is known.
            val themeMode by session.themeModeFlow.collectAsState(initial = null)
            val isLoggedIn by remember { session.tokenFlow.map { !it.isNullOrBlank() } }.collectAsState(initial = null)
            val biometricEnabled by session.biometricEnabledFlow.collectAsState(initial = null)
            // "" = no PIN; null = not read yet (the lock screen must not take "not read" for "none")
            val pinHash by remember { session.pinCodeFlow.map { it ?: "" } }.collectAsState(initial = null)
            val language by session.languageFlow.collectAsState(initial = null)
            val userName by session.userNameFlow.collectAsState(initial = null)
            // Every tr() call reads this, so changing it in Profil redraws the whole app.
            LaunchedEffect(language) { language?.let { I18n.language = it } }
            // Saveable so rotating the phone doesn't lock the app again.
            var unlocked by rememberSaveable { mutableStateOf(false) }

            val isDark = when (themeMode) {
                "dark" -> true
                "light" -> false
                else -> isSystemInDarkTheme()
            }

            SchoolDayTheme(darkTheme = isDark) {
                // One Surface at the root: every screen (lock, PIN, dialogs) gets the theme's text colour.
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val loggedIn = isLoggedIn
                    when {
                        loggedIn == null || themeMode == null || biometricEnabled == null || language == null || pinHash == null ->
                            Box(Modifier.fillMaxSize())

                        !loggedIn -> {
                            // Signed out (or the token expired): forget the other account's schools
                            LaunchedEffect(Unit) { scopeStore.clear(); unlocked = false }
                            LoginScreen()
                        }

                        biometricEnabled == true && !unlocked -> BiometricLockScreen(
                            pinHash = pinHash?.ifEmpty { null },
                            onUnlocked = { unlocked = true },
                            onPinSet = { pin -> lifecycleScope.launch { session.setPinCode(PinCode.hash(pin)) } },
                            // Sign out; the login screen opens because the session is gone.
                            onUsePassword = { lifecycleScope.launch { session.clearSession() } }
                        )

                        else -> {
                            // Already inside the app: turning biometrics on in Profil must not lock it right away.
                            LaunchedEffect(Unit) { unlocked = true }
                            MainNavGraph(userName = userName.orEmpty())
                        }
                    }
                }
            }
        }
    }
}
