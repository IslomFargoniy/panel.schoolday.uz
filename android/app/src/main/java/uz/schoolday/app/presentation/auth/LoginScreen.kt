package uz.schoolday.app.presentation.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import uz.schoolday.app.R
import uz.schoolday.app.presentation.components.ErrorBanner
import uz.schoolday.app.presentation.theme.SchoolDayTheme
import uz.schoolday.app.util.tr

@Composable
fun LoginScreen(viewModel: LoginViewModel = hiltViewModel()) {
    val ui by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current
    var passwordVisible by remember { mutableStateOf(false) }
    val c = SchoolDayTheme.colors

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .systemBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(Modifier.height(24.dp))
        Image(
            painter = painterResource(R.drawable.ic_logo),
            contentDescription = "SchoolDay",
            modifier = Modifier.size(80.dp).clip(RoundedCornerShape(20.dp))
        )
        Spacer(Modifier.height(20.dp))
        Text("SchoolDay", style = MaterialTheme.typography.headlineLarge.copy(fontWeight = FontWeight.ExtraBold), color = MaterialTheme.colorScheme.onBackground)
        Text(tr("Maktab davomati va monitoring"), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(32.dp))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(MaterialTheme.colorScheme.surface)
                .border(1.dp, c.border, RoundedCornerShape(20.dp))
                .padding(20.dp)
        ) {
            Text(
                if (ui.needsCode) tr("Ikki bosqichli tasdiqlash") else tr("Tizimga kirish"),
                style = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(Modifier.height(16.dp))

            ui.errorMessage?.let {
                ErrorBanner(it)
                Spacer(Modifier.height(16.dp))
            }

            if (!ui.needsCode) {
                OutlinedTextField(
                    value = ui.login,
                    onValueChange = viewModel::onLoginChanged,
                    label = { Text(tr("Email yoki telefon raqam")) },
                    leadingIcon = { Icon(Icons.Outlined.Person, null, tint = MaterialTheme.colorScheme.primary) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(onNext = { focusManager.moveFocus(FocusDirection.Down) }),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(16.dp))
                OutlinedTextField(
                    value = ui.password,
                    onValueChange = viewModel::onPasswordChanged,
                    label = { Text(tr("Parol")) },
                    leadingIcon = { Icon(Icons.Outlined.Lock, null, tint = MaterialTheme.colorScheme.primary) },
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff, tr("Parolni ko'rsatish"))
                        }
                    },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus(); viewModel.submit() }),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            } else {
                Text(
                    if (ui.useRecoveryCode) tr("Zaxira kodlaringizdan birini kiriting.")
                    else tr("Autentifikator ilovasidagi 6 xonali kodni kiriting."),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = ui.code,
                    onValueChange = viewModel::onCodeChanged,
                    label = { Text(if (ui.useRecoveryCode) tr("Zaxira kod") else tr("Tasdiqlash kodi")) },
                    leadingIcon = { Icon(Icons.Outlined.Pin, null, tint = MaterialTheme.colorScheme.primary) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = if (ui.useRecoveryCode) KeyboardType.Text else KeyboardType.NumberPassword,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus(); viewModel.submit() }),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                TextButton(onClick = viewModel::toggleRecoveryCode, modifier = Modifier.align(Alignment.End)) {
                    Text(if (ui.useRecoveryCode) tr("Autentifikator kodi bilan") else tr("Zaxira kod bilan kirish"), style = MaterialTheme.typography.labelLarge)
                }
            }

            Spacer(Modifier.height(20.dp))
            Button(
                onClick = { focusManager.clearFocus(); viewModel.submit() },
                enabled = !ui.isLoading,
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                if (ui.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
                } else {
                    Text(if (ui.needsCode) tr("Tasdiqlash") else tr("Kirish"), style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                }
            }
            if (ui.needsCode) {
                TextButton(onClick = viewModel::cancelCode, modifier = Modifier.align(Alignment.CenterHorizontally)) { Text(tr("Orqaga")) }
            }
        }

        Spacer(Modifier.height(12.dp))
        Text(
            tr("Hisobni maktab administratori ochib beradi"),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )

        TextButton(onClick = viewModel::toggleServerConfig) {
            Icon(Icons.Outlined.Dns, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.width(6.dp))
            Text(
                if (ui.showServerConfig) tr("Server sozlamalarini berkitish") else tr("Server manzilini sozlash"),
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        if (ui.showServerConfig) {
            OutlinedTextField(
                value = ui.baseUrl,
                onValueChange = viewModel::onBaseUrlChanged,
                label = { Text(tr("Server API URL")) },
                placeholder = { Text("https://panel.schoolday.uz/api/") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            )
        }
        Spacer(Modifier.height(24.dp))
    }
}
