package uz.schoolday.app.update

import androidx.compose.runtime.Composable

/** Google Play build: Play updates the app, so there is no self-update. */
@Composable
fun UpdatePrompt() = Unit

/** Google Play build: no manual update check, the Profil screen only shows the version. */
@Composable
fun rememberUpdateChecker(): UpdateChecker? = null
