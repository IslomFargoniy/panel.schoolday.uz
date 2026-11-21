package uz.schoolday.app.util

import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

/** Every tr("…") text in the app needs a Russian and an English line in Translations.kt. */
class TranslationsTest {
    private val trCall = Regex("""tr\("((?:[^"\\]|\\.)*)"""")
    // Bottom bar titles go through tr(screen.title)
    private val screenTitles = listOf("Asosiy", "Monitoring", "O'quvchilar", "Profil")

    private fun keysInSources(): Set<String> =
        // main plus the play / direct flavor code (the in-app updater lives in src/direct)
        listOf("src/main/java", "src/direct/java", "src/play/java").map(::File).filter { it.exists() }
            .flatMap { it.walkTopDown() }
            .filter { it.extension == "kt" && it.name != "Translations.kt" }
            .flatMap { file -> trCall.findAll(file.readText()).map { it.groupValues[1].replace("\\\"", "\"") } }
            .toSet() + screenTitles

    @Test
    fun everyKeyHasRussian() {
        val missing = keysInSources().filterNot { it in RU }
        assertTrue("Missing RU: $missing", missing.isEmpty())
    }

    @Test
    fun everyKeyHasEnglish() {
        val missing = keysInSources().filterNot { it in EN }
        assertTrue("Missing EN: $missing", missing.isEmpty())
    }

    @Test
    fun placeholdersMatch() {
        val bad = (RU.entries + EN.entries).filter { (uz, other) -> uz.split("%s").size != other.split("%s").size }
        assertTrue("Placeholder count differs: ${bad.map { it.key }}", bad.isEmpty())
    }
}
