@extends('legal.layout')

@section('title', 'Delete account')

@section('content')
<section id="en">
    <h1>Delete your SchoolDay account</h1>
    <h2>In the app</h2>
    <ol>
        <li>Open SchoolDay and sign in.</li>
        <li>Go to <b>Profile</b> (bottom tab), scroll down and tap <b>Delete account</b>.</li>
        <li>Enter your password and confirm.</li>
    </ol>
    <p>Your account, profile data (name, login, email, phone, Telegram ID) and all access tokens are deleted immediately and cannot be restored.</p>
    <h2>Without the app</h2>
    <p>Send an email to <a href="mailto:{{ $email }}?subject=Delete%20SchoolDay%20account">{{ $email }}</a> from the address of your account,
        with your login and school name. We delete the account within 7 days and reply when it is done.</p>
    <h2>What is kept</h2>
    <p>Student and attendance records belong to the school, not to your personal account, so they stay until the school deletes them.
        A school administrator can delete students, reports and events in the panel at any time.</p>
</section>

<section id="uz">
    <h1>SchoolDay hisobini o‘chirish</h1>
    <h2>Ilovada</h2>
    <ol>
        <li>SchoolDay’ni oching va kiring.</li>
        <li><b>Profil</b> (pastki menyu) → <b>Hisobni o‘chirish</b>.</li>
        <li>Parolni kiriting va tasdiqlang.</li>
    </ol>
    <p>Hisob, profil ma’lumotlari (ism, login, email, telefon, Telegram ID) va barcha tokenlar darhol o‘chiriladi, qayta tiklanmaydi.</p>
    <h2>Ilovasiz</h2>
    <p>Hisobingiz emailidan <a href="mailto:{{ $email }}?subject=Delete%20SchoolDay%20account">{{ $email }}</a> ga login va maktab nomini yozing. 7 kun ichida o‘chiramiz va javob beramiz.</p>
    <h2>Nima qoladi</h2>
    <p>O‘quvchi va davomat ma’lumotlari maktabga tegishli; ularni maktab administratori panelda o‘chiradi.</p>
</section>

<section id="ru">
    <h1>Удаление аккаунта SchoolDay</h1>
    <h2>В приложении</h2>
    <ol>
        <li>Откройте SchoolDay и войдите.</li>
        <li><b>Профиль</b> → <b>Удалить аккаунт</b>.</li>
        <li>Введите пароль и подтвердите.</li>
    </ol>
    <p>Аккаунт, данные профиля (имя, логин, email, телефон, Telegram ID) и токены удаляются сразу и без возможности восстановления.</p>
    <h2>Без приложения</h2>
    <p>Напишите с email аккаунта на <a href="mailto:{{ $email }}?subject=Delete%20SchoolDay%20account">{{ $email }}</a>, указав логин и школу. Удалим в течение 7 дней.</p>
    <h2>Что остаётся</h2>
    <p>Данные учеников и посещаемости принадлежат школе и удаляются администратором школы.</p>
</section>
@endsection
