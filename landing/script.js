// ===== Translations =====
const translations = {
    uz: {
        badge: "Maktab va bog'cha uchun elektron davomat",
        heading1: "Maktab va bog'cha uchun",
        heading2: "Face ID davomat va turniket tizimi",
        description: "SchoolDay — Hikvision Face ID terminallari orqali o'quvchilar kelib-ketishini avtomatik qayd etadi, ota-onaga Telegram'da xabar yuboradi va davomatni real vaqtda ko'rsatadi.",
        btn_login: "Tizimga kirish",
        btn_contact: "Bog'lanish",
        feature1_title: "Maktab Davomat Tizimi",
        feature1_desc: "Maktabingiz uchun elektron davomat. Har bir kirish-chiqish real vaqtda qayd etiladi, kechikkan va kelmaganlar darhol ko'rinadi, hisobot Excel'ga yuklanadi.",
        feature2_title: "Turniket va Face ID",
        feature2_desc: "Hikvision yuzni tanish terminallari — alohida yoki turniket bilan. Karta kerak emas, o'quvchi yuzi bilan o'tadi.",
        feature3_title: "Telegram Xabarnomalar",
        feature3_desc: "Farzandingiz maktabga kelganida yoki ketganida Telegram'da rasm va vaqt bilan darhol xabar oling. Ilova o'rnatish shart emas.",
        contact_title: "Biz bilan bog'laning",
        contact_desc: "Savollaringiz bormi? Biz bilan quyidagi usullar orqali bog'laning.",
        contact_telegram: "Telegram orqali tez aloqa",
        contact_phone: "Telefon",
        contact_phone_desc: "Bizga qo'ng'iroq qiling",
        contact_phone_desc2: "Qo'shimcha telefon raqam",
        footer: "Barcha huquqlar himoyalangan.",
        page_title: "SchoolDay — maktab va bog'cha uchun Face ID davomat va turniket",
        meta_desc: "Maktab va bog'chalar uchun elektron davomat tizimi: Hikvision Face ID terminallari, turniket, ota-onalarga Telegram xabarnomalar va Excel hisobotlar.",
        meta_keywords: "maktab davomat tizimi, turniket tizimlari, bog'cha davomati, yuzni tanish davomati, Face ID maktab, o'quvchilar xavfsizligi, telegram bot davomat, Hikvision davomat tizimi, elektron davomat, maktab xavfsizligi, o'quvchi nazorati"
    },
    ru: {
        badge: "Электронная посещаемость для школ и садов",
        heading1: "Система посещаемости",
        heading2: "для школ и детских садов с Face ID",
        description: "SchoolDay автоматически фиксирует приход и уход учеников через терминалы Hikvision Face ID, отправляет уведомления родителям в Telegram и показывает посещаемость в реальном времени.",
        btn_login: "Войти в систему",
        btn_contact: "Связаться с нами",
        feature1_title: "Система посещаемости",
        feature1_desc: "Электронная посещаемость для вашей школы. Каждый вход и выход фиксируется в реальном времени, опоздавшие и отсутствующие видны сразу, отчет выгружается в Excel.",
        feature2_title: "Турникеты и Face ID",
        feature2_desc: "Терминалы распознавания лиц Hikvision — отдельно или с турникетом. Карты не нужны, ученик проходит по лицу.",
        feature3_title: "Telegram Уведомления",
        feature3_desc: "Получайте сообщение с фото и временем в Telegram, когда ребенок пришел в школу или ушел. Устанавливать приложение не нужно.",
        contact_title: "Свяжитесь с нами",
        contact_desc: "Есть вопросы? Свяжитесь с нами любым удобным способом.",
        contact_telegram: "Быстрая связь через Telegram",
        contact_phone: "Телефон",
        contact_phone_desc: "Позвоните нам",
        contact_phone_desc2: "Дополнительный номер",
        footer: "Все права защищены.",
        page_title: "SchoolDay — посещаемость по Face ID и турникет для школ и садов",
        meta_desc: "Система учета посещаемости для школ и детских садов: терминалы Hikvision Face ID, турникеты, уведомления родителям в Telegram и отчеты в Excel.",
        meta_keywords: "школьная система посещаемости, системы турникетов, посещаемость в детском саду, распознавание лиц, Face ID для школы, безопасность учащихся, телеграм бот для школы, Hikvision системы, электронная посещаемость, контроль доступа в школу"
    },
    en: {
        badge: "Electronic attendance for schools and kindergartens",
        heading1: "Face ID attendance",
        heading2: "for schools and kindergartens",
        description: "SchoolDay records student arrivals and departures via Hikvision Face ID terminals, notifies parents on Telegram and shows attendance in real time.",
        btn_login: "Sign In",
        btn_contact: "Contact Us",
        feature1_title: "School Attendance System",
        feature1_desc: "Electronic attendance for your school. Every entry and exit is recorded in real time, late and absent students are visible instantly, and reports export to Excel.",
        feature2_title: "Turnstiles and Face ID",
        feature2_desc: "Hikvision face recognition terminals — standalone or with a turnstile. No cards needed: students pass with their face.",
        feature3_title: "Telegram Notifications",
        feature3_desc: "Get a Telegram message with a photo and time when your child arrives at or leaves school. No app to install.",
        contact_title: "Get in Touch",
        contact_desc: "Have questions? Reach out to us through any of the following channels.",
        contact_telegram: "Quick contact via Telegram",
        contact_phone: "Phone",
        contact_phone_desc: "Give us a call",
        contact_phone_desc2: "Secondary phone number",
        footer: "All rights reserved.",
        page_title: "SchoolDay - Smart Attendance and Turnstile System for Schools & Kindergartens",
        meta_desc: "The ultimate school attendance system featuring Hikvision turnstiles, Face ID recognition, and instant Telegram notifications for parents. Ensure student safety with smart management.",
        meta_keywords: "school attendance system, turnstile systems, kindergarten attendance, face recognition, Face ID for schools, student safety, telegram bot for attendance, Hikvision attendance system, electronic attendance, school access control"
    }
};

// ===== State =====
let currentLang = localStorage.getItem('sd-lang') || 'uz';
let currentTheme = localStorage.getItem('sd-theme') || 'dark';

// ===== Theme =====
function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sd-theme', theme);
}

function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

// ===== Language =====
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('sd-lang', lang);
    const t = translations[lang];

    // Update text content
    const updateText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    updateText('badge-text', t.badge);
    updateText('heading1', t.heading1 + ' ');
    updateText('heading2', t.heading2);
    updateText('description', t.description);
    updateText('btn-login', t.btn_login);
    updateText('btn-contact', t.btn_contact);
    updateText('feature1-title', t.feature1_title);
    updateText('feature1-desc', t.feature1_desc);
    updateText('feature2-title', t.feature2_title);
    updateText('feature2-desc', t.feature2_desc);
    updateText('feature3-title', t.feature3_title);
    updateText('feature3-desc', t.feature3_desc);
    updateText('contact-title', t.contact_title);
    updateText('contact-desc', t.contact_desc);
    updateText('contact-telegram-desc', t.contact_telegram);
    updateText('contact-phone1-name', t.contact_phone);
    updateText('contact-phone1-desc', t.contact_phone_desc);
    updateText('contact-phone2-name', t.contact_phone);
    updateText('contact-phone2-desc', t.contact_phone_desc2);
    updateText('footer-rights', t.footer);

    // Update page title & meta
    document.title = t.page_title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t.meta_desc);
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', t.meta_keywords);

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    setTheme(currentTheme);
    setLanguage(currentLang);

    const header = document.querySelector('.header');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });

    // Scroll effect for header
    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header?.classList.add('header--scrolled');
        } else {
            header?.classList.remove('header--scrolled');
        }
    });

    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
