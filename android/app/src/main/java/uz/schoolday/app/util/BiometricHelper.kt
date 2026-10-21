package uz.schoolday.app.util

import android.content.Context
import android.content.ContextWrapper
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

object BiometricHelper {
    // Fingerprint or face; WEAK also covers face unlock on most phones.
    private const val AUTHENTICATORS = BiometricManager.Authenticators.BIOMETRIC_WEAK

    /** null when the device can authenticate, otherwise a message to show the user. */
    fun unavailableReason(context: Context): String? =
        when (BiometricManager.from(context).canAuthenticate(AUTHENTICATORS)) {
            BiometricManager.BIOMETRIC_SUCCESS -> null
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED ->
                tr("Telefonda barmoq izi yoki yuz qo'shilmagan. Avval telefon sozlamalarida qo'shing.")
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE ->
                tr("Bu telefonda biometrik skaner yo'q.")
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE ->
                tr("Biometrik skaner hozir ishlamayapti. Keyinroq urinib ko'ring.")
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED ->
                tr("Biometrik kirish uchun telefon xavfsizlik yangilanishini o'rnating.")
            else -> tr("Bu telefonda biometrik kirish ishlamaydi.")
        }

    fun authenticate(
        activity: FragmentActivity,
        title: String,
        subtitle: String,
        negativeText: String,
        onSuccess: () -> Unit,
        onFailure: (message: String?) -> Unit
    ) {
        val prompt = BiometricPrompt(
            activity,
            ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    val cancelled = errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                        errorCode == BiometricPrompt.ERROR_USER_CANCELED ||
                        errorCode == BiometricPrompt.ERROR_CANCELED
                    onFailure(if (cancelled) null else errString.toString())
                }
                // onAuthenticationFailed (finger not recognised) keeps the prompt open, nothing to do.
            }
        )
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setNegativeButtonText(negativeText)
            .setAllowedAuthenticators(AUTHENTICATORS)
            .build()
        prompt.authenticate(info)
    }
}

/** Compose's LocalContext may be a wrapper; BiometricPrompt needs the hosting FragmentActivity. */
fun Context.findFragmentActivity(): FragmentActivity? {
    var ctx: Context? = this
    while (ctx is ContextWrapper) {
        if (ctx is FragmentActivity) return ctx
        ctx = ctx.baseContext
    }
    return null
}
