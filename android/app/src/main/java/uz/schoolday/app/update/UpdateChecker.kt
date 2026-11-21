package uz.schoolday.app.update

/**
 * Manual "Yangilanishni tekshirish" action for the Profil screen.
 * Only the direct (APK) build provides one; the Play build gets null and just shows the version.
 */
class UpdateChecker(
    val isChecking: Boolean,
    val check: () -> Unit,
)
