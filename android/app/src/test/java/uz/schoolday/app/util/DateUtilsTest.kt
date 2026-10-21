package uz.schoolday.app.util

import org.junit.Assert.assertEquals
import org.junit.Test

class DateUtilsTest {
    @Test
    fun shiftsDaysAcrossMonths() {
        assertEquals("2026-09-30", DateUtils.shiftDay("2026-10-01", -1))
        assertEquals("2027-01-01", DateUtils.shiftDay("2026-12-31", 1))
    }

    @Test
    fun shiftsMonthsAcrossYears() {
        assertEquals("2025-12", DateUtils.shiftMonth("2026-01", -1))
        assertEquals("2027-02", DateUtils.shiftMonth("2026-11", 3))
    }

    @Test
    fun formatsTimesFromDateTimeOrTime() {
        assertEquals("08:05", DateUtils.formatTime("2026-10-21 08:05:12"))
        assertEquals("13:20", DateUtils.formatTime("13:20:00"))
        assertEquals("—", DateUtils.formatTime(null))
    }

    @Test
    fun formatsDisplayDates() {
        assertEquals("21.10.2026", DateUtils.formatDisplayDate("2026-10-21"))
        assertEquals("21.10", DateUtils.formatDayMonth("2026-10-21 08:00:00"))
    }

    @Test
    fun longDateInUzbek() {
        I18n.language = "uz"
        assertEquals("Chorshanba, 21-oktabr", DateUtils.formatLongDate("2026-10-21"))
    }

    @Test
    fun initialsOfTwoWords() {
        assertEquals("AV", initials("Ali Valiyev Karimovich"))
        assertEquals("?", initials("  "))
    }
}
