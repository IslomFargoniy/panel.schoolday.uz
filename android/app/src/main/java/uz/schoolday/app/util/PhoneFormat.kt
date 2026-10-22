package uz.schoolday.app.util

import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation

/**
 * Phone numbers, same rules as App\Support\Phone on the server and lib/format.ts on the web.
 * Stored as "+998901234567"; shown as "+998 90 123 45 67".
 * Without "+" a number is taken as Uzbek; other countries are typed with "+" and their code.
 */
object PhoneFormat {
    private const val UZ = "998"

    /** "+998901234567" → "+998 90 123 45 67" for display; other values are returned as is. */
    fun display(value: String?): String? {
        if (value.isNullOrBlank()) return value
        val digits = value.filter { it.isDigit() }
        return when {
            digits.length == 12 && digits.startsWith(UZ) -> uz(digits.drop(3))
            digits.length == 9 && !value.trim().startsWith("+") -> uz(digits)
            digits.length in 10..15 && !digits.startsWith(UZ) -> "+" + digits.chunked(3).joinToString(" ")
            else -> value
        }
    }

    /** Keep what a phone field may contain: digits and one leading "+", at most 15 digits. */
    fun sanitize(raw: String): String {
        val plus = raw.trimStart().startsWith("+")
        val digits = raw.filter { it.isDigit() }.take(15)
        return if (plus) "+$digits" else digits
    }

    /** Typed text looks like a phone (not an email): starts with a digit or "+". */
    fun looksLikePhone(text: String): Boolean = text.trimStart().firstOrNull()?.let { it.isDigit() || it == '+' } == true

    /** Formatted while typing, from the sanitised raw value. */
    fun asYouType(raw: String): String {
        if (raw.isEmpty() || raw == "+") return raw
        val plus = raw.startsWith("+")
        var digits = raw.filter { it.isDigit() }
        if (!plus && !digits.startsWith(UZ)) digits = UZ + digits
        return if (digits.startsWith(UZ)) {
            val rest = digits.drop(3).take(9)
            listOf("+998", rest.take(2), rest.drop(2).take(3), rest.drop(5).take(2), rest.drop(7).take(2))
                .filter { it.isNotEmpty() }
                .joinToString(" ")
        } else {
            "+" + digits.chunked(3).joinToString(" ")
        }
    }

    private fun uz(nine: String) = "+998 ${nine.take(2)} ${nine.drop(2).take(3)} ${nine.drop(5).take(2)} ${nine.drop(7).take(2)}"
}

/**
 * Shows a raw phone value ("901234567", "+998901234567") formatted, without touching what is
 * stored, so the cursor and backspace behave naturally.
 */
class PhoneVisualTransformation : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val raw = text.text
        val shown = PhoneFormat.asYouType(raw)

        // Positions (in `shown`) of each digit, and how many digits the formatting added ("998")
        val digitPositions = shown.indices.filter { shown[it].isDigit() }
        val rawDigits = raw.count { it.isDigit() }
        val added = (digitPositions.size - rawDigits).coerceAtLeast(0)

        val mapping = object : OffsetMapping {
            override fun originalToTransformed(offset: Int): Int {
                val digitsBefore = raw.take(offset).count { it.isDigit() }
                if (digitsBefore == 0) return if (offset == 0 && added == 0) 0 else minOf(shown.length, if (added > 0) 5 else 1)
                val index = added + digitsBefore - 1
                return (digitPositions.getOrNull(index)?.plus(1) ?: shown.length).coerceAtMost(shown.length)
            }

            override fun transformedToOriginal(offset: Int): Int {
                val digitsBefore = (shown.take(offset).count { it.isDigit() } - added).coerceAtLeast(0)
                if (digitsBefore == 0) return if (raw.startsWith("+") && offset > 0) 1 else 0
                var seen = 0
                raw.forEachIndexed { i, c ->
                    if (c.isDigit()) {
                        seen++
                        if (seen == digitsBefore) return i + 1
                    }
                }
                return raw.length
            }
        }
        return TransformedText(AnnotatedString(shown), mapping)
    }
}

/** MAC while typing: hex digits only, upper case, a colon after every pair. */
fun formatMacInput(value: String): String =
    value.filter { it.isDigit() || it.lowercaseChar() in 'a'..'f' }.uppercase().take(12).chunked(2).joinToString(":")

/** Shows "1250000" as "1 250 000" without changing the stored digits. */
object ThousandsTransformation : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val digits = text.text
        val grouped = digits.reversed().chunked(3).joinToString(" ").reversed()
        val mapping = object : OffsetMapping {
            // A space sits before every group of three counted from the right
            override fun originalToTransformed(offset: Int): Int {
                val spaces = ((digits.length - 1) / 3) - ((digits.length - offset - 1).coerceAtLeast(0) / 3)
                return (offset + spaces.coerceAtLeast(0)).coerceIn(0, grouped.length)
            }

            override fun transformedToOriginal(offset: Int): Int =
                grouped.take(offset).count { it != ' ' }.coerceIn(0, digits.length)
        }
        return TransformedText(AnnotatedString(grouped), mapping)
    }
}
