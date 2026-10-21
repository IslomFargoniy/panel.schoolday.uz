package uz.schoolday.app.util

import java.text.SimpleDateFormat
import java.util.*

object DateUtils {
    private val apiDateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun today(): String = apiDateFormat.format(Date())

    /** "2026-10-14" ± days → "2026-10-13". */
    fun shiftDay(date: String, days: Int): String {
        val cal = Calendar.getInstance().apply { time = apiDateFormat.parse(date) ?: Date(); add(Calendar.DAY_OF_MONTH, days) }
        return apiDateFormat.format(cal.time)
    }

    /** "2026-10" ± months → "2026-09". */
    fun shiftMonth(month: String, months: Int): String {
        val (y, m) = month.split("-").map { it.toInt() }
        val total = y * 12 + (m - 1) + months
        return "%04d-%02d".format(total / 12, total % 12 + 1)
    }

    fun currentMonth(): String = today().take(7)

    /** Material date pickers work in UTC midnight millis. */
    fun toUtcMillis(date: String): Long {
        val f = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
        return f.parse(date)?.time ?: System.currentTimeMillis()
    }

    fun fromUtcMillis(millis: Long): String {
        val f = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
        return f.format(Date(millis))
    }

    private val weekdays = mapOf(
        "uz" to listOf("Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"),
        "ru" to listOf("Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"),
        "en" to listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    )
    private val shortWeekdays = mapOf(
        "uz" to listOf("Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"),
        "ru" to listOf("Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"),
        "en" to listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa")
    )
    // Nominative month names (headers like "Oktabr 2026")
    private val months = mapOf(
        "uz" to listOf("yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"),
        "ru" to listOf("январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"),
        "en" to listOf("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
    )
    // Genitive for full dates ("14 октября")
    private val ruMonthsGenitive = listOf("января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря")

    private fun lang() = I18n.language.takeIf { it in months } ?: "uz"

    /** "2026-10-14" → "Seshanba, 14-oktabr" (in the app language). */
    fun formatLongDate(dateStr: String?): String {
        if (dateStr.isNullOrBlank()) return "-"
        return try {
            val date = apiDateFormat.parse(dateStr.take(10)) ?: return dateStr
            val cal = Calendar.getInstance().apply { time = date }
            val day = cal.get(Calendar.DAY_OF_MONTH)
            val month = cal.get(Calendar.MONTH)
            val weekday = weekdays.getValue(lang())[cal.get(Calendar.DAY_OF_WEEK) - 1]
            when (lang()) {
                "ru" -> "$weekday, $day ${ruMonthsGenitive[month]}"
                "en" -> "$weekday, ${months.getValue("en")[month]} $day"
                else -> "$weekday, $day-${months.getValue("uz")[month]}"
            }
        } catch (e: Exception) {
            dateStr
        }
    }

    /** "2026-10-14" → "Se" (short weekday in the app language). */
    fun shortWeekday(dateStr: String): String = try {
        val cal = Calendar.getInstance().apply { time = apiDateFormat.parse(dateStr.take(10)) ?: Date() }
        shortWeekdays.getValue(lang())[cal.get(Calendar.DAY_OF_WEEK) - 1]
    } catch (e: Exception) {
        ""
    }

    /** Month name for a "yyyy-MM" or "yyyy-MM-dd" string, e.g. "Oktabr". */
    fun monthName(dateStr: String?): String {
        val month = dateStr?.substringAfter('-')?.take(2)?.toIntOrNull() ?: return ""
        return months.getValue(lang()).getOrNull(month - 1)?.replaceFirstChar { it.uppercase() } ?: ""
    }

    /** "2026-10-14" → "14.10.2026". */
    fun formatDisplayDate(dateStr: String?): String {
        val p = dateStr?.take(10)?.split("-")?.takeIf { it.size == 3 } ?: return dateStr ?: "-"
        return "${p[2]}.${p[1]}.${p[0]}"
    }

    /** "2026-10-14" → "14.10". */
    fun formatDayMonth(dateStr: String?): String {
        val p = dateStr?.take(10)?.split("-")?.takeIf { it.size == 3 } ?: return dateStr ?: "-"
        return "${p[2]}.${p[1]}"
    }

    /** "2026-10-14 08:05:12" or "08:05:12" → "08:05". */
    fun formatTime(value: String?): String {
        if (value.isNullOrBlank()) return "—"
        val time = if (value.length > 10 && value[10] == ' ') value.substring(11) else value
        return time.take(5)
    }
}

/** First letters of the first two words: "Ali Valiyev" → "AV". */
fun initials(name: String): String =
    name.split(" ").filter { it.isNotBlank() }.take(2).joinToString("") { it.first().uppercase() }.ifBlank { "?" }
