package uz.schoolday.app.util

import java.security.MessageDigest

/** 4-digit app PIN. Only a hash is stored on the phone. */
object PinCode {
    const val LENGTH = 4

    fun hash(pin: String): String =
        MessageDigest.getInstance("SHA-256").digest("schoolday-pin:$pin".toByteArray())
            .joinToString("") { "%02x".format(it) }

    fun matches(pin: String, storedHash: String?): Boolean = storedHash != null && hash(pin) == storedHash

    /** Keeps digits only, at most [LENGTH]. */
    fun clean(input: String): String = input.filter { it.isDigit() }.take(LENGTH)
}
