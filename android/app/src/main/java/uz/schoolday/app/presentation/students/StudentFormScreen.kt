package uz.schoolday.app.presentation.students

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material.icons.outlined.PhotoLibrary
import androidx.compose.material.icons.rounded.KeyboardArrowDown
import androidx.compose.material.icons.rounded.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavController
import coil.compose.AsyncImage
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import uz.schoolday.app.data.remote.dto.FilterSchool
import uz.schoolday.app.data.repository.*
import uz.schoolday.app.presentation.components.*
import uz.schoolday.app.presentation.navigation.finishForm
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.DateUtils
import uz.schoolday.app.util.FacePhoto
import uz.schoolday.app.util.initials
import uz.schoolday.app.util.tr
import java.io.File
import javax.inject.Inject

data class StudentFormUiState(
    val isEdit: Boolean = false,
    val form: StudentForm = StudentForm(),
    val currentPhotoUrl: String? = null,
    val newPhoto: File? = null,
    val checkingPhoto: Boolean = false,
    val loading: Boolean = false,
    val saving: Boolean = false,
    val deleting: Boolean = false,
    val error: String? = null,
    /** Set once saved / deleted: the screen closes. */
    val done: Boolean = false,
    val deleted: Boolean = false
)

@HiltViewModel
class StudentFormViewModel @Inject constructor(
    private val repository: SchoolRepository,
    private val manage: ManageRepository,
    private val scopeStore: ScopeStore,
    @ApplicationContext private val context: android.content.Context,
    savedState: SavedStateHandle
) : ViewModel() {
    private val studentId: Int? = savedState.get<Int>("studentId")?.takeIf { it > 0 }
    private val presetClassId: Int? = savedState.get<Int>("classId")?.takeIf { it > 0 }

    private val _ui = MutableStateFlow(StudentFormUiState(isEdit = studentId != null, form = StudentForm(classId = presetClassId)))
    val ui: StateFlow<StudentFormUiState> = _ui.asStateFlow()
    val schools: StateFlow<List<FilterSchool>> = scopeStore.schools

    init {
        viewModelScope.launch { scopeStore.load() }
        if (studentId != null) load(studentId)
    }

    private fun load(id: Int) {
        viewModelScope.launch {
            _ui.update { it.copy(loading = true) }
            when (val r = repository.student(id, DateUtils.currentMonth())) {
                is Resource.Success -> {
                    val s = r.data!!.student
                    _ui.update {
                        it.copy(
                            loading = false,
                            currentPhotoUrl = s.faceImage,
                            form = StudentForm(
                                name = s.name,
                                classId = s.classId,
                                phone = s.phone.orEmpty(),
                                address = s.address.orEmpty(),
                                telegramId = s.telegramId.orEmpty(),
                                status = s.status ?: "active",
                                gender = s.gender ?: "unknown",
                                employeeNo = s.employeeNo.orEmpty(),
                                userVerifyMode = s.userVerifyMode ?: "face",
                                localUiRight = s.localUiRight,
                                doorRight = s.doorRight ?: "1",
                                planTemplateNo = s.planTemplateNo ?: "1",
                                validEnabled = s.validEnabled,
                                validBegin = s.validBegin.orEmpty(),
                                validEnd = s.validEnd.orEmpty()
                            )
                        )
                    }
                }
                is Resource.Error -> _ui.update { it.copy(loading = false, error = r.message) }
            }
        }
    }

    fun edit(change: (StudentForm) -> StudentForm) = _ui.update { it.copy(form = change(it.form), error = null) }

    /** Checks the face and crops it; a rejected picture keeps the previous one. */
    fun onPicture(uri: Uri) {
        viewModelScope.launch {
            _ui.update { it.copy(checkingPhoto = true, error = null) }
            when (val r = FacePhoto.prepare(context, uri)) {
                is FacePhoto.Result.Ok -> _ui.update { it.copy(checkingPhoto = false, newPhoto = r.file) }
                is FacePhoto.Result.Rejected -> _ui.update { it.copy(checkingPhoto = false, error = r.message) }
            }
        }
    }

    fun save() {
        val s = _ui.value
        when {
            s.form.name.isBlank() -> return _ui.update { it.copy(error = tr("Ismni kiriting")) }
            s.form.classId == null -> return _ui.update { it.copy(error = tr("Sinfni tanlang")) }
        }
        viewModelScope.launch {
            _ui.update { it.copy(saving = true, error = null) }
            when (val r = manage.saveStudent(studentId, s.form, s.newPhoto)) {
                is Resource.Success -> _ui.update { it.copy(saving = false, done = true) }
                is Resource.Error -> _ui.update { it.copy(saving = false, error = r.message) }
            }
        }
    }

    fun delete() {
        val id = studentId ?: return
        viewModelScope.launch {
            _ui.update { it.copy(deleting = true, error = null) }
            when (val r = manage.deleteStudent(id)) {
                is Resource.Success -> _ui.update { it.copy(deleting = false, done = true, deleted = true) }
                is Resource.Error -> _ui.update { it.copy(deleting = false, error = r.message) }
            }
        }
    }
}

/** Terminal verification modes (Hikvision userVerifyMode). */
private val VERIFY_MODES = listOf(
    "face" to "Yuz", "faceOrPw" to "Yuz yoki parol", "cardOrFace" to "Karta yoki yuz",
    "faceAndCard" to "Yuz va karta", "faceAndPw" to "Yuz va parol", "card" to "Karta", "cardAndPw" to "Karta va parol",
    "cardOrfaceOrPw" to "Karta, yuz yoki parol"
)

@Composable
fun StudentFormScreen(navController: NavController, viewModel: StudentFormViewModel = hiltViewModel()) {
    val ui by viewModel.ui.collectAsState()
    val schools by viewModel.schools.collectAsState()
    val context = LocalContext.current
    val f = ui.form
    var confirmDelete by remember { mutableStateOf(false) }
    var showTerminal by remember { mutableStateOf(false) }
    var cameraUri by remember { mutableStateOf<Uri?>(null) }

    LaunchedEffect(ui.done) {
        if (ui.done) {
            Toast.makeText(context, if (ui.deleted) tr("O'chirildi") else tr("Saqlandi"), Toast.LENGTH_SHORT).show()
            navController.finishForm(deletedFromDetail = ui.deleted)
        }
    }

    val camera = rememberLauncherForActivityResult(ActivityResultContracts.TakePicture()) { ok ->
        if (ok) cameraUri?.let(viewModel::onPicture)
    }
    val gallery = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        uri?.let(viewModel::onPicture)
    }
    fun openCamera() {
        val dir = File(context.cacheDir, "camera").apply { mkdirs() }
        val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", File(dir, "shot_${System.currentTimeMillis()}.jpg"))
        cameraUri = uri
        camera.launch(uri)
    }

    // "5-A · 1-smena · Asosiy bino"
    val classOptions = remember(schools) {
        schools.flatMap { school ->
            school.branches.flatMap { b ->
                b.shifts.flatMap { sh -> sh.classes.map { c -> c.id as Int? to listOfNotNull(c.name, sh.name, b.name.takeIf { school.branches.size > 1 }).joinToString(" · ") } }
            }
        }.sortedBy { it.second }
    }

    if (confirmDelete) {
        ConfirmDeleteDialog(
            title = tr("O'quvchini o'chirish"),
            text = tr("%s o'chiriladi va Face ID terminallardan ham olib tashlanadi.", f.name),
            onConfirm = { confirmDelete = false; viewModel.delete() },
            onDismiss = { confirmDelete = false }
        )
    }

    FormScaffold(
        title = if (ui.isEdit) tr("O'quvchini tahrirlash") else tr("Yangi o'quvchi"),
        onBack = { navController.popBackStack() },
        onSave = viewModel::save,
        saving = ui.saving || ui.deleting,
        error = ui.error,
        onDelete = if (ui.isEdit) ({ confirmDelete = true }) else null
    ) {
        if (ui.loading) {
            LoadingBox()
            return@FormScaffold
        }

        // Face photo
        SdCard(padding = PaddingValues(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(84.dp).clip(CircleShape), contentAlignment = Alignment.Center) {
                    val model: Any? = ui.newPhoto ?: ui.currentPhotoUrl
                    if (model != null) {
                        AsyncImage(model = model, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
                    } else {
                        Avatar(null, f.name.ifBlank { "?" }, sizeDp = 84)
                    }
                    if (ui.checkingPhoto) CircularProgressIndicator(Modifier.size(32.dp), strokeWidth = 3.dp)
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(tr("Yuz rasmi"), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold))
                    Text(
                        if (ui.newPhoto != null) tr("Yangi rasm tayyor") else tr("Terminal shu rasm bo'yicha taniydi"),
                        style = MaterialTheme.typography.bodyMedium,
                        color = if (ui.newPhoto != null) SchoolDayTheme.colors.success else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
                        FilledTonalButton(onClick = ::openCamera, enabled = !ui.checkingPhoto, contentPadding = PaddingValues(horizontal = 12.dp)) {
                            Icon(Icons.Outlined.PhotoCamera, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text(tr("Kamera"))
                        }
                        OutlinedButton(
                            onClick = { gallery.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) },
                            enabled = !ui.checkingPhoto,
                            contentPadding = PaddingValues(horizontal = 12.dp)
                        ) {
                            Icon(Icons.Outlined.PhotoLibrary, null, Modifier.size(18.dp)); Spacer(Modifier.width(6.dp)); Text(tr("Galereya"))
                        }
                    }
                }
            }
        }

        FormSectionTitle(tr("Asosiy"))
        SdTextField(f.name, { v -> viewModel.edit { it.copy(name = v) } }, tr("F.I.SH"))
        SelectField(tr("Sinf"), f.classId, classOptions, { v -> viewModel.edit { it.copy(classId = v) } })
        SelectField(
            tr("Jinsi"), f.gender,
            listOf("unknown" to tr("Ko'rsatilmagan"), "male" to tr("O'g'il bola"), "female" to tr("Qiz bola")),
            { v -> viewModel.edit { it.copy(gender = v) } }
        )
        SelectField(tr("Holat"), f.status, listOf("active" to tr("Faol"), "inactive" to tr("Faol emas")), { v -> viewModel.edit { it.copy(status = v) } })

        FormSectionTitle(tr("Aloqa"))
        SdTextField(f.phone, { v -> viewModel.edit { it.copy(phone = v) } }, tr("Telefon"), keyboardType = KeyboardType.Phone, placeholder = "+998 90 123 45 67")
        SdTextField(f.address, { v -> viewModel.edit { it.copy(address = v) } }, tr("Manzil"), singleLine = false, minLines = 2)
        SdTextField(
            f.telegramId, { v -> viewModel.edit { it.copy(telegramId = v.filter { c -> c.isDigit() || c == '-' }) } }, tr("Ota-ona Telegram ID"),
            keyboardType = KeyboardType.Number,
            supporting = tr("Ota-ona botga telefon raqamini yuborsa, o'zi ulanadi")
        )

        // Terminal settings: rarely changed, folded away
        Row(
            Modifier.fillMaxWidth().clickable { showTerminal = !showTerminal }.padding(vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(tr("Terminal sozlamalari"), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold), modifier = Modifier.weight(1f))
            Icon(if (showTerminal) Icons.Rounded.KeyboardArrowUp else Icons.Rounded.KeyboardArrowDown, null)
        }
        AnimatedVisibility(showTerminal) {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                SdTextField(f.employeeNo, { v -> viewModel.edit { it.copy(employeeNo = v) } }, tr("ID raqam (terminal)"), supporting = tr("Bo'sh qoldirilsa, avtomatik beriladi"))
                SelectField(tr("Tasdiqlash usuli"), f.userVerifyMode, VERIFY_MODES.map { it.first to tr(it.second) }, { v -> viewModel.edit { it.copy(userVerifyMode = v) } })
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SdTextField(f.doorRight, { v -> viewModel.edit { it.copy(doorRight = v) } }, tr("Eshik ruxsati"), Modifier.weight(1f))
                    SdTextField(f.planTemplateNo, { v -> viewModel.edit { it.copy(planTemplateNo = v) } }, tr("Jadval shabloni"), Modifier.weight(1f))
                }
                SwitchRow(tr("Terminal menyusiga kirish"), f.localUiRight, { v -> viewModel.edit { it.copy(localUiRight = v) } })
                SwitchRow(tr("Amal qilish muddati"), f.validEnabled, { v -> viewModel.edit { it.copy(validEnabled = v) } }, tr("Muddatdan tashqarida terminal kiritmaydi"))
                if (f.validEnabled) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        DateField(f.validBegin.ifBlank { DateUtils.today() }, { v -> viewModel.edit { it.copy(validBegin = v) } }, tr("Boshlanish"), Modifier.weight(1f))
                        DateField(f.validEnd.ifBlank { DateUtils.today() }, { v -> viewModel.edit { it.copy(validEnd = v) } }, tr("Tugash"), Modifier.weight(1f), maxToday = false)
                    }
                }
            }
        }
    }
}
