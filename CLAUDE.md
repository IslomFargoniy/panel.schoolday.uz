# SchoolDay — loyiha qoidalari

## Android: Google Play'ga chiqarilmaydi (2026-11-21 qaror)

- SchoolDay Android ilovasi **Google Play Market'ga chiqarilmaydi**. Play Console'dagi ilova olib tashlanadi/nashrdan chiqariladi.
- Ilova faqat to'g'ridan-to'g'ri APK orqali tarqatiladi: `https://panel.schoolday.uz/downloads/schoolday.apk` (panel sidebar'idagi "Android ilova (APK)" havolasi) va ilova ichidagi yangilash (`public/downloads/version.json`).
- Reliz: `scripts/release-android.sh "o'zgarishlar"` → `direct` flavor APK serverga yuklanadi, `version.json` commit qilinadi, so'ng deploy.
- Play uchun AAB yuklash, Play Console'ni to'ldirish, Play talablari (skrinshot, listing, Data safety) bo'yicha ish **qilinmaydi**. `play` flavor kodda qolgan, lekin ishlatilmaydi.
- Har bir relizda `versionCode` oshiriladi (ilova ichidagi yangilash shu raqamni solishtiradi).
