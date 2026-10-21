package uz.schoolday.app.presentation.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.view.WindowCompat

// Brand accents (readable on both light and dark surfaces)
private val RawIndigo600 = Color(0xFF4F46E5)
val Indigo700 = Color(0xFF4338CA)
val Indigo500 = Color(0xFF6366F1)

val Emerald500 = Color(0xFF10B981)
private val RawEmerald600 = Color(0xFF059669)

val Amber500 = Color(0xFFF59E0B)
private val RawAmber600 = Color(0xFFD97706)

val Rose500 = Color(0xFFF43F5E)
private val RawRose600 = Color(0xFFE11D48)

val Slate900 = Color(0xFF0F172A)
val Slate800 = Color(0xFF1E293B)
val Slate700 = Color(0xFF334155)
val Slate600 = Color(0xFF475569)
val Slate500 = Color(0xFF64748B)
val Slate400 = Color(0xFF94A3B8)

// Night palette (same as multitest.uz)
private val NightBackground = Color(0xFF0B1020)
private val NightSurface = Color(0xFF111830)
private val NightSurface2 = Color(0xFF172040)
private val NightBorder = Color(0xFF1E2744)
private val NightBorderStrong = Color(0xFF2A3557)
private val NightTextPrimary = Color(0xFFE8ECF5)
private val NightTextMuted = Color(0xFF9AA5BD)
private val NightPrimary = Color(0xFF5B63E6)
private val NightAccentText = Color(0xFFAEB5FF)
private val NightSuccess = Color(0xFF3FCF8E)
private val NightSuccessBg = Color(0xFF173628)
private val NightWarning = Color(0xFFF5B14C)
private val NightWarningBg = Color(0xFF3A2A12)
private val NightDestructive = Color(0xFFF07178)
private val NightDestructiveBg = Color(0xFF3A1820)
private val NightIndigoBg = Color(0xFF1D2250)

// Light palette (same as multitest.uz)
private val LightBackground = Color(0xFFF5F7FB)
private val LightSurface = Color(0xFFFFFFFF)
private val LightSurface2 = Color(0xFFEEF1F8)
private val LightBorder = Color(0xFFDDE3EF)
private val LightBorderStrong = Color(0xFFC9D1E2)
private val LightTextPrimary = Color(0xFF0F1424)
private val LightTextMuted = Color(0xFF566078)
private val LightPrimary = Color(0xFF4F57D9)
private val LightIndigoBg = Color(0xFFEEF2FF)
private val LightSuccessBg = Color(0xFFECFDF5)
private val LightWarningBg = Color(0xFFFFFBEB)
private val LightDestructiveBg = Color(0xFFFFF1F2)

/** Theme-dependent colors that Material's ColorScheme has no slot for. */
@Immutable
data class SdColors(
    val isDark: Boolean,
    val surface2: Color,
    val border: Color,
    val borderStrong: Color,
    val accentText: Color,
    val indigoBg: Color,
    val success: Color,
    val successBg: Color,
    val warning: Color,
    val warningBg: Color,
    val danger: Color,
    val dangerBg: Color,
    // Liquid glass bottom bar
    val glassBarBase: Color,
    val glassBarTint: Color,
    val glassBarStrokeTop: Color,
    val glassBarStrokeBottom: Color,
    val dropletFillTop: Color,
    val dropletFillBottom: Color,
    val dropletRimTop: Color,
    val dropletRimBottom: Color,
    val dropletGlow: Color,
    val navSelected: Color
)

private val DarkSdColors = SdColors(
    isDark = true,
    surface2 = NightSurface2,
    border = NightBorder,
    borderStrong = NightBorderStrong,
    accentText = NightAccentText,
    indigoBg = NightIndigoBg,
    success = NightSuccess,
    successBg = NightSuccessBg,
    warning = NightWarning,
    warningBg = NightWarningBg,
    danger = NightDestructive,
    dangerBg = NightDestructiveBg,
    glassBarBase = NightBackground,
    glassBarTint = Color(0x8C0F1530),
    glassBarStrokeTop = Color.White.copy(alpha = 0.22f),
    glassBarStrokeBottom = Color.White.copy(alpha = 0.04f),
    dropletFillTop = Color.White.copy(alpha = 0.20f),
    dropletFillBottom = Color.White.copy(alpha = 0.06f),
    dropletRimTop = Color.White.copy(alpha = 0.45f),
    dropletRimBottom = Color.White.copy(alpha = 0.05f),
    dropletGlow = Indigo500.copy(alpha = 0.55f),
    navSelected = Color.White
)

private val LightSdColors = SdColors(
    isDark = false,
    surface2 = LightSurface2,
    border = LightBorder,
    borderStrong = LightBorderStrong,
    accentText = LightPrimary,
    indigoBg = LightIndigoBg,
    success = RawEmerald600,
    successBg = LightSuccessBg,
    warning = RawAmber600,
    warningBg = LightWarningBg,
    danger = RawRose600,
    dangerBg = LightDestructiveBg,
    glassBarBase = LightBackground,
    glassBarTint = Color(0xB8FFFFFF),
    glassBarStrokeTop = Color.White.copy(alpha = 0.95f),
    glassBarStrokeBottom = LightBorderStrong.copy(alpha = 0.6f),
    dropletFillTop = LightPrimary.copy(alpha = 0.16f),
    dropletFillBottom = LightPrimary.copy(alpha = 0.08f),
    dropletRimTop = LightPrimary.copy(alpha = 0.35f),
    dropletRimBottom = LightPrimary.copy(alpha = 0.10f),
    dropletGlow = LightPrimary.copy(alpha = 0.22f),
    navSelected = LightPrimary
)

val LocalSdColors = staticCompositionLocalOf { DarkSdColors }

object SchoolDayTheme {
    val colors: SdColors
        @Composable @ReadOnlyComposable get() = LocalSdColors.current
}

// Accent text/icon colours follow the theme too (the raw 600 shades are too dark on the night background)
val Indigo600: Color @Composable @ReadOnlyComposable get() = MaterialTheme.colorScheme.primary
val Emerald600: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.success
val Amber600: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.warning
val Rose600: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.danger

// Soft tint backgrounds follow the theme, so they don't glare as pastel patches in dark mode.
val Indigo50: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.indigoBg
val Emerald50: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.successBg
val Amber50: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.warningBg
val Rose50: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.dangerBg
val Slate50: Color @Composable @ReadOnlyComposable get() = MaterialTheme.colorScheme.background
val Slate100: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.border
val Slate200: Color @Composable @ReadOnlyComposable get() = SchoolDayTheme.colors.borderStrong

private val LightColorScheme = lightColorScheme(
    primary = LightPrimary,
    onPrimary = Color.White,
    primaryContainer = LightIndigoBg,
    onPrimaryContainer = Indigo700,
    secondary = RawEmerald600,
    onSecondary = Color.White,
    secondaryContainer = LightSuccessBg,
    onSecondaryContainer = RawEmerald600,
    tertiary = Amber500,
    background = LightBackground,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightSurface2,
    onSurfaceVariant = LightTextMuted,
    outline = LightBorder,
    outlineVariant = LightBorder,
    error = RawRose600,
    onError = Color.White
)

private val DarkColorScheme = darkColorScheme(
    primary = NightPrimary,
    onPrimary = Color.White,
    primaryContainer = NightIndigoBg,
    onPrimaryContainer = NightAccentText,
    secondary = NightSuccess,
    onSecondary = NightBackground,
    secondaryContainer = NightSuccessBg,
    onSecondaryContainer = NightSuccess,
    tertiary = NightWarning,
    background = NightBackground,
    onBackground = NightTextPrimary,
    surface = NightSurface,
    onSurface = NightTextPrimary,
    surfaceVariant = NightSurface2,
    onSurfaceVariant = NightTextMuted,
    surfaceContainer = NightSurface,
    surfaceContainerHigh = NightSurface2,
    surfaceContainerHighest = NightSurface2,
    outline = NightBorderStrong,
    outlineVariant = NightBorder,
    error = NightDestructive,
    onError = Color.White
)

val SdTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 36.sp
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 22.sp,
        lineHeight = 28.sp
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 24.sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 22.sp
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 15.sp,
        lineHeight = 20.sp
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 13.sp,
        lineHeight = 18.sp
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 18.sp
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        lineHeight = 14.sp
    )
)

val SdShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)

@Composable
fun SchoolDayTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val sdColors = if (darkTheme) DarkSdColors else LightSdColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    CompositionLocalProvider(LocalSdColors provides sdColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = SdTypography,
            shapes = SdShapes,
            content = content
        )
    }
}
