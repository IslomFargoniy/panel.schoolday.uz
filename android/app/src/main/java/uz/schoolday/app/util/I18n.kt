package uz.schoolday.app.util

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * App language. Uzbek text in the code is the key; Russian and English come from the tables in Translations.kt.
 * [language] is Compose state, so every Text that calls [tr] redraws as soon as it changes.
 */
object I18n {
    var language by mutableStateOf("uz")

    fun translate(uz: String): String = when (language) {
        "ru" -> RU[uz]
        "en" -> EN[uz]
        else -> null
    } ?: uz
}

/** Translate an Uzbek UI string; `%s` placeholders are filled from [args]. */
fun tr(uz: String, vararg args: Any?): String {
    val text = I18n.translate(uz)
    return if (args.isEmpty()) text else String.format(text, *args)
}
