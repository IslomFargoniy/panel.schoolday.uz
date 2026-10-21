# SchoolDay Android

Maktab admini uchun mobil ilova: davomat, jonli monitoring, o'quvchilar, sinflar, hisobotlar (Excel) va Face ID qurilmalar holati.
Dizayn va arxitektura `panel.payday.uz/android` bilan bir xil: Kotlin, Jetpack Compose (Material3), Hilt, Retrofit va DataStore.

## API

Laravel `routes/api.php` ichidagi `/api/v1/*` (Sanctum token, `school` ability). Login: `POST /api/v1/auth/login` `{login, password, code?}`.
Barcha ma'lumot `App\Support\Tenant` orqali foydalanuvchi maktablari bilan cheklanadi.

## Release

```bash
./release.sh            # testlar + imzolangan APK va AAB; APK → ../public/android/schoolday-v<versiya>.apk
./release.sh --upload   # + APK'ni serverga yuklaydi: https://panel.schoolday.uz/android/schoolday-v<versiya>.apk
```

Yangi versiyadan oldin `app/build.gradle.kts` dagi `versionCode` ni 1 ga oshiring va `versionName` ni yangilang.
Fayl nomlari versiyadan olinadi: `schoolday-v1.0.0-release.apk` va `.aab`.

Imzo: `keystore.properties` va `schoolday-release.keystore` (ikkalasi ham gitga qo'shilmaydi).
**Bu ikki faylning zaxira nusxasini xavfsiz joyda saqlang**: kalit yo'qolsa, o'rnatilgan ilovani yangilab bo'lmaydi.

## Play Market

- Yuklanadigan fayl: `app/build/outputs/bundle/release/schoolday-v<versiya>-release.aab`.
- Play App Signing yoqiladi; bizning keystore "upload key" bo'lib qoladi.
- Crash hisobotlari uchun `app/build/outputs/mapping/release/mapping.txt` ni shu versiyaga yuklang.
- Paket nomi `uz.schoolday.app`, minSdk 26, targetSdk 36.
- Play Console'da kerak bo'ladi: maxfiylik siyosati URL'i (saytda hali yo'q), 512×512 ikonka, 1024×500 banner,
  telefon skrinshotlari, Data safety anketasi (login, o'quvchi ismi va davomati serverdan o'qiladi; telefondan hech narsa yig'ilmaydi).
- Kirish faqat maktab bergan hisob bilan: ko'rib chiquvchilar uchun "App access" bo'limiga demo login kiriting.

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
