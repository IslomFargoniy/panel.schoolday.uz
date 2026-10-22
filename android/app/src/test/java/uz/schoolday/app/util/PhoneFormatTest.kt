package uz.schoolday.app.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PhoneFormatTest {
    @Test
    fun displaysStoredUzbekNumbers() {
        assertEquals("+998 90 123 45 67", PhoneFormat.display("+998901234567"))
        assertEquals("+998 90 123 45 67", PhoneFormat.display("998901234567"))
        assertEquals("+998 90 123 45 67", PhoneFormat.display("901234567"))
    }

    @Test
    fun leavesUnknownValuesAlone() {
        assertEquals("12345", PhoneFormat.display("12345"))
        assertEquals(null, PhoneFormat.display(null))
    }

    @Test
    fun formatsWhileTyping() {
        assertEquals("+998 90 12", PhoneFormat.asYouType("9012"))
        assertEquals("+998 90 123 45 67", PhoneFormat.asYouType("+998901234567"))
        assertEquals("+791 612", PhoneFormat.asYouType("+791612"))
    }

    @Test
    fun keepsOnlyDigitsAndLeadingPlus() {
        assertEquals("+998901234567", PhoneFormat.sanitize("+998 (90) 123-45-67"))
        assertEquals("901234567", PhoneFormat.sanitize("90 123 45 67"))
    }

    @Test
    fun tellsPhonesFromEmails() {
        assertTrue(PhoneFormat.looksLikePhone("+998"))
        assertTrue(PhoneFormat.looksLikePhone("90"))
        assertFalse(PhoneFormat.looksLikePhone("admin@school.uz"))
    }

    @Test
    fun macGetsColons() {
        assertEquals("88:DE:39:32:D8:0F", formatMacInput("88-de-39-32-d8-0f"))
        assertEquals("88:DE:3", formatMacInput("88de3"))
        assertEquals("88:DE:39:32:D8:0F", formatMacInput("88de3932d80f99"))
    }
}
