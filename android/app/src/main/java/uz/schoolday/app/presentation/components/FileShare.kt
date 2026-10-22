package uz.schoolday.app.presentation.components

import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import uz.schoolday.app.util.tr
import java.io.File

private const val XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

/** Hands a downloaded Excel file to Telegram, Drive, Excel… */
fun shareExcel(context: Context, file: File, title: String) {
    val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = XLSX
        putExtra(Intent.EXTRA_STREAM, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    try {
        context.startActivity(Intent.createChooser(intent, title))
    } catch (e: ActivityNotFoundException) {
        android.widget.Toast.makeText(context, tr("Faylni ochadigan ilova topilmadi"), android.widget.Toast.LENGTH_LONG).show()
    }
}
