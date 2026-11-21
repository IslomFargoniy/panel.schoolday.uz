# SchoolDay Android

Web paneldagi har bir amal ilovada ham bor, rolga qarab:

- **Maktab admini:** davomat, jonli monitoring, hisobotlar (Excel, o'chirish); o'quvchilar (CRUD, yuz rasmi kamera/galereyadan, Excel import), sinflar, smenalar, filiallar, qurilmalar; profil, 2FA.
- **Admin:** + maktablar (yaratish, tahrirlash, o'chirish), maktab sozlamalari, foydalanuvchini maktabga biriktirish.
- **Superadmin:** + foydalanuvchilar (rol bilan) va tizim sozlamalari (Telegram bot token).

Menyular `auth/me` dagi `permissions` bo'yicha ko'rinadi; har bir so'rovni server baribir tekshiradi.
Dizayn va arxitektura `panel.payday.uz/android` bilan bir xil: Kotlin, Jetpack Compose (Material3), Hilt, Retrofit va DataStore.

## API

Laravel `routes/api.php` ichidagi `/api/v1/*` (Sanctum token, `school` ability). Login: `POST /api/v1/auth/login` `{login, password, code?}`.
Barcha ma'lumot `App\Support\Tenant` orqali foydalanuvchi maktablari bilan cheklanadi.
Biznes qoidalari (filial limiti, o'chirish shartlari…) `app/Actions` da: web panel ham, API ham shularni ishlatadi.
Xato matnlari `public/locales/{uz,ru,en}` dan, ilova yuborgan `Accept-Language` tilida qaytadi.

Yuz tekshiruvi ML Kit (Google Play services orqali, model APK ichida emas). Play services bo'lmagan telefonda tekshiruv o'tkazib yuboriladi.

## Release

Ikki flavor:

- `direct` → `uz.schoolday.app.direct`, saytdagi APK: `https://panel.schoolday.uz/downloads/schoolday.apk`. Ilova har ochilganda `/downloads/version.json` ni o'qiydi, yangi `versionCode` bo'lsa APK'ni ilova ichida yuklab o'rnatadi (Profil → "Yangilanishni tekshirish"). Alohida id bo'lgani uchun Play'dagi ilova yonida o'rnatiladi.
- `play` → `uz.schoolday.app`, Google Play uchun AAB: yangilovchi ham, `REQUEST_INSTALL_PACKAGES` ham yo'q.

```bash
scripts/release-android.sh "Nima o'zgardi"              # testlar, APK + AAB, imzo tekshiruvi, APK'ni serverga yuklaydi, version.json
scripts/release-android.sh --no-upload "Nima o'zgardi"  # yuklamaydi, scp buyruqlarini chiqaradi
```

Fayllar: `~/Desktop/android-releases/SchoolDay_v<versiya>.apk` va `.aab` (Play Console'ga AAB).
Keyin `public/downloads/version.json` ni commit qilib deploy qiling. `android/release.sh` shu skriptni chaqiradi (`--upload` bilan yuklaydi).

Yangi versiyadan oldin `app/build.gradle.kts` dagi `versionCode` ni 1 ga oshiring va `versionName` ni yangilang.

## Play Market

- Yuklanadigan fayl: `app/build/outputs/bundle/playRelease/schoolday-v<versiya>-play-release.aab (yoki ~/Desktop/android-releases/SchoolDay_v<versiya>.aab)`.
- Play App Signing yoqiladi; bizning keystore "upload key" bo'lib qoladi.
- Crash hisobotlari uchun `app/build/outputs/mapping/playRelease/mapping.txt` ni shu versiyaga yuklang.
- Paket nomi `uz.schoolday.app`, minSdk 26, targetSdk 36.
- Play Console'da kerak bo'ladi: maxfiylik siyosati https://panel.schoolday.uz/privacy, hisobni o‘chirish https://panel.schoolday.uz/delete-account, 512×512 ikonka, 1024×500 banner,
  telefon skrinshotlari, Data safety anketasi (login, o'quvchi ismi va davomati serverdan o'qiladi; telefondan hech narsa yig'ilmaydi).
- Kirish faqat maktab bergan hisob bilan: ko‘rib chiquvchilar uchun "App access" ga review@schoolday.uz kiriting; demo maktabni tiklash: `php artisan schoolday:play-demo`.

## Testlar

```bash
./gradlew :app:testDebugUnitTest    # tarjimalar va sana yordamchilari
./gradlew :app:assembleDebug        # app/build/outputs/apk/debug/
```

## Lokal server bilan sinash

Kirish ekranida "Server manzilini sozlash" → `http://10.0.2.2:8000/api/` (emulyatordan kompyuterga).
Shifrlanmagan HTTP faqat debug build'da va faqat `10.0.2.2` / `localhost` uchun ruxsat etilgan (`src/debug`).

## Tarjima

O'zbekcha matn kodning o'zida (`tr("...")`), rus va ingliz tarjimalari `util/Translations.kt` faylida.
Yangi matn qo'shilsa, `TranslationsTest` ikkala tarjima ham borligini tekshiradi.
