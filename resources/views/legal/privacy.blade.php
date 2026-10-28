@extends('legal.layout')

@section('title', 'Privacy Policy')

@section('content')
<section id="en">
    <h1>Privacy Policy</h1>
    <p class="muted">Last updated: 28 October 2026</p>

    <p>SchoolDay (the web panel at panel.schoolday.uz and the SchoolDay Android app) is an attendance system for schools.
        Students check in and out at face-recognition terminals installed in the school; school staff use SchoolDay to manage
        students and see attendance. The app is for school staff only: accounts are created by the school, there is no public sign-up.</p>

    <h2>What we process</h2>
    <ul>
        <li><b>Staff accounts:</b> name, login/email, phone number, password (stored hashed), optional Telegram ID, two-factor settings.</li>
        <li><b>Student records entered by the school:</b> full name, class, gender, phone number, address, comment, and a face photo.
            The face photo is sent to the school's own face-recognition terminals so they can recognise the student.</li>
        <li><b>Attendance events:</b> time of entry/exit, terminal, and the snapshot taken by the terminal.</li>
        <li><b>Technical data:</b> an access token for your session and the app language. We do not use advertising or analytics SDKs.</li>
    </ul>

    <h2>What the app does on your phone</h2>
    <ul>
        <li><b>Camera / gallery:</b> only when you choose to take or pick a student's photo. The photo is checked on the device for a face
            (Google ML Kit, on-device) and then uploaded to the school's account.</li>
        <li><b>Fingerprint / face unlock and PIN:</b> optional app lock. Biometric data never leaves your phone and is handled by Android.</li>
        <li><b>Files:</b> Excel reports you export are saved and shared only when you ask.</li>
        <li>The app does not access your location, contacts, call log, SMS or microphone.</li>
    </ul>

    <h2>Who can see the data</h2>
    <p>Data of a school is visible only to that school's staff accounts, according to their role, and to SchoolDay administrators for support.
        If the school turns on Telegram notifications, attendance messages (with the terminal snapshot) are sent to the Telegram chats the school has linked,
        for example parents'. We do not sell data and do not share it with third parties for advertising.</p>

    <h2>Security and storage</h2>
    <p>All traffic between the app and the server is encrypted (HTTPS). Data is stored on our servers and kept while the school uses SchoolDay.
        The school can edit or delete students, reports and events at any time.</p>

    <h2>Deleting your account</h2>
    <p>In the app: <b>Settings → Delete account</b> (password required). Your account and access tokens are deleted immediately.
        You can also request deletion by email; see <a href="{{ url('/delete-account') }}">{{ url('/delete-account') }}</a>.
        Student and attendance records belong to the school and are deleted by the school.</p>

    <h2>Children</h2>
    <p>The app is not meant to be used by children. Student data is entered and managed by the school, which is responsible for having the consent required by law.</p>

    <h2>Contact</h2>
    <p><a href="mailto:{{ $email }}">{{ $email }}</a></p>
</section>

<section id="uz">
    <h1>Maxfiylik siyosati</h1>
    <p class="muted">Oxirgi yangilanish: 2026-yil 28-oktabr</p>

    <p>SchoolDay (panel.schoolday.uz web paneli va SchoolDay Android ilovasi) — maktablar uchun davomat tizimi. O‘quvchilar maktabdagi
        yuzni tanish terminallarida kirish-chiqishni qayd etadi; maktab xodimlari SchoolDay orqali o‘quvchilarni boshqaradi va davomatni ko‘radi.
        Ilova faqat maktab xodimlari uchun: hisobni maktab yaratadi, ochiq ro‘yxatdan o‘tish yo‘q.</p>

    <h2>Qanday ma’lumotlar</h2>
    <ul>
        <li><b>Xodim hisobi:</b> ism, login/email, telefon raqami, parol (shifrlangan holda), ixtiyoriy Telegram ID, ikki bosqichli himoya sozlamasi.</li>
        <li><b>Maktab kiritgan o‘quvchi ma’lumotlari:</b> F.I.Sh., sinf, jinsi, telefon, manzil, izoh va yuz rasmi. Yuz rasmi maktabning o‘z terminallariga yuboriladi.</li>
        <li><b>Davomat:</b> kirish/chiqish vaqti, terminal va terminal olgan surat.</li>
        <li><b>Texnik:</b> sessiya tokeni va ilova tili. Reklama yoki analitika SDK’lari ishlatilmaydi.</li>
    </ul>

    <h2>Telefonda</h2>
    <ul>
        <li><b>Kamera/galereya:</b> faqat o‘quvchi rasmini olishni tanlaganingizda. Rasm telefonda yuz bor-yo‘qligi tekshiriladi (Google ML Kit, qurilmada) va maktab hisobiga yuklanadi.</li>
        <li><b>Barmoq izi/yuz bilan ochish va PIN:</b> ixtiyoriy. Biometrik ma’lumot telefondan chiqmaydi.</li>
        <li><b>Fayllar:</b> Excel hisobotlar faqat siz so‘raganda saqlanadi va ulashiladi.</li>
        <li>Ilova joylashuv, kontaktlar, qo‘ng‘iroqlar, SMS va mikrofonga kirmaydi.</li>
    </ul>

    <h2>Kim ko‘radi</h2>
    <p>Maktab ma’lumotini faqat shu maktab xodimlari (roliga qarab) va yordam uchun SchoolDay administratorlari ko‘radi. Maktab Telegram xabarnomani yoqsa,
        davomat xabarlari (terminal surati bilan) maktab ulagan Telegram chatlarga, masalan ota-onalarga yuboriladi. Ma’lumot sotilmaydi va reklama uchun uzatilmaydi.</p>

    <h2>Xavfsizlik</h2>
    <p>Ilova va server orasidagi barcha aloqa shifrlangan (HTTPS). Ma’lumot maktab SchoolDay’dan foydalanguncha saqlanadi; maktab istalgan vaqtda o‘chira oladi.</p>

    <h2>Hisobni o‘chirish</h2>
    <p>Ilovada: <b>Sozlamalar → Hisobni o‘chirish</b> (parol so‘raladi). Yoki email orqali: <a href="{{ url('/delete-account') }}">{{ url('/delete-account') }}</a>.
        O‘quvchi va davomat ma’lumotlari maktabga tegishli va maktab tomonidan o‘chiriladi.</p>

    <h2>Aloqa</h2>
    <p><a href="mailto:{{ $email }}">{{ $email }}</a></p>
</section>

<section id="ru">
    <h1>Политика конфиденциальности</h1>
    <p class="muted">Обновлено: 28 октября 2026</p>

    <p>SchoolDay (веб-панель panel.schoolday.uz и Android-приложение SchoolDay) — система учёта посещаемости для школ. Ученики отмечаются на терминалах
        распознавания лиц в школе; сотрудники школы управляют учениками и смотрят посещаемость. Приложение только для сотрудников школы: аккаунт создаёт школа.</p>

    <h2>Какие данные</h2>
    <ul>
        <li><b>Аккаунт сотрудника:</b> имя, логин/email, телефон, пароль (в виде хэша), Telegram ID (необязательно), настройки 2FA.</li>
        <li><b>Данные учеников, вводимые школой:</b> ФИО, класс, пол, телефон, адрес, комментарий и фото лица. Фото передаётся на терминалы этой школы.</li>
        <li><b>Посещаемость:</b> время входа/выхода, терминал и снимок с терминала.</li>
        <li><b>Технические:</b> токен сессии и язык приложения. Рекламные и аналитические SDK не используются.</li>
    </ul>

    <h2>На телефоне</h2>
    <ul>
        <li><b>Камера/галерея:</b> только когда вы снимаете или выбираете фото ученика. Наличие лица проверяется на устройстве (Google ML Kit), затем фото загружается.</li>
        <li><b>Отпечаток/лицо и PIN:</b> необязательная блокировка; биометрия не покидает телефон.</li>
        <li>Приложение не использует геолокацию, контакты, звонки, SMS и микрофон.</li>
    </ul>

    <h2>Кто видит данные</h2>
    <p>Только сотрудники школы (по роли) и администраторы SchoolDay для поддержки. При включённых Telegram-уведомлениях сообщения о посещаемости
        (со снимком) отправляются в чаты, подключённые школой, например родителям. Данные не продаются.</p>

    <h2>Удаление аккаунта</h2>
    <p>В приложении: <b>Настройки → Удалить аккаунт</b>. Или по email: <a href="{{ url('/delete-account') }}">{{ url('/delete-account') }}</a>.</p>

    <h2>Контакты</h2>
    <p><a href="mailto:{{ $email }}">{{ $email }}</a></p>
</section>
@endsection
