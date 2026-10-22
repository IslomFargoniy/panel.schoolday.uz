package uz.schoolday.app.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.NavController

private const val CHANGED = "changed"

/** Tells the screen below that something it shows was created, edited or deleted. */
fun NavController.notifyChanged() {
    previousBackStackEntry?.savedStateHandle?.set(CHANGED, true)
}

/** Runs [onChanged] when a screen opened from here reported a change, then passes the news further down. */
@Composable
fun OnChangedReturn(navController: NavController, onChanged: () -> Unit) {
    val handle = navController.currentBackStackEntry?.savedStateHandle ?: return
    val changed by handle.getStateFlow(CHANGED, false).collectAsState()
    LaunchedEffect(changed) {
        if (changed) {
            handle[CHANGED] = false
            onChanged()
            navController.notifyChanged()
        }
    }
}

/**
 * Closes a create / edit screen and refreshes what's below. After a delete opened from a detail
 * page that page is closed too (its record no longer exists).
 */
fun NavController.finishForm(deletedFromDetail: Boolean = false) {
    notifyChanged()
    popBackStack()
    if (deletedFromDetail) {
        notifyChanged()
        popBackStack()
    }
}
