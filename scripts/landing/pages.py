"""schoolday.uz SEO sahifalari (ru, maktab-turniket) generatori. Ishlatish: python3 scripts/landing/pages.py — natija landing/ ga yoziladi."""
import html, json, os, sys


def esc(t):
    """Escape for text and double-quoted attributes; keep apostrophes readable (o'zbekcha)."""
    return html.escape(t, quote=False).replace('"', "&quot;")


OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "landing")
BASE = "https://schoolday.uz"
PHONE, PHONE_TXT, TG = "+998911157709", "+998 91 115 77 09", "https://t.me/IslomFargniy"

EXTRA_CSS = """
    .seo-section{max-width:860px;margin:0 auto;padding:3rem 1.5rem;position:relative;z-index:1}
    .seo-section h2{font-size:clamp(1.5rem,3vw,2rem);font-weight:700;color:var(--heading-color);margin-bottom:1rem;line-height:1.25}
    .seo-section p,.seo-section li{color:var(--text-light);font-size:1.05rem;line-height:1.75;margin-bottom:.75rem}
    .seo-section ol{padding-left:1.2em}
    .seo-section a{color:#f97316}
    .seo-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem;max-width:1100px;margin:0 auto;padding:1rem 1.5rem 2rem;position:relative;z-index:1}
    .seo-card{background:var(--card-bg);border:1px solid var(--card-border);border-radius:1rem;padding:1.5rem;backdrop-filter:blur(12px)}
    .seo-card h3{font-size:1.1rem;font-weight:700;color:var(--heading-color);margin-bottom:.5rem}
    .seo-card p{color:var(--text-light);line-height:1.6;font-size:.95rem}
    .seo-faq details{background:var(--card-bg);border:1px solid var(--card-border);border-radius:.75rem;padding:1rem 1.25rem;margin-bottom:.75rem}
    .seo-faq summary{cursor:pointer;font-weight:600;color:var(--heading-color)}
    .seo-faq details p{margin:.75rem 0 0}
    .seo-cta{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.5rem}
    .seo-btn{display:inline-block;padding:.85rem 1.4rem;border-radius:.75rem;font-weight:600;text-decoration:none;border:1px solid var(--card-border);color:var(--heading-color);background:var(--card-bg)}
    .seo-btn--primary{background:#f97316;border-color:#f97316;color:#fff}
    .crumbs{font-size:.85rem;color:var(--text-lighter);margin-bottom:1rem}
    .crumbs a{color:inherit}
    .seo-footer-links{display:flex;gap:1.25rem;flex-wrap:wrap;justify-content:center;margin-bottom:.75rem}
    .seo-footer-links a{color:var(--text-light)}
"""

UI = {
    "uz": dict(login="Tizimga kirish", call="Qo'ng'iroq qilish", tg="Telegramga yozish", faq="Ko'p beriladigan savollar",
               rights="Barcha huquqlar himoyalangan.", contact="Bepul maslahat oling",
               contact_p="Maktabingiz yoki bog'changiz uchun qaysi turniket va terminal kerakligini aniqlab, narxini hisoblab beramiz.",
               links=[("/", "Bosh sahifa"), ("/maktab-turniket/", "Maktab uchun turniket"), ("/maqolalar/", "Maqolalar"), ("/ru/", "Русская версия"), ("https://panel.schoolday.uz/privacy", "Maxfiylik siyosati")]),
    "ru": dict(login="Войти", call="Позвонить", tg="Написать в Telegram", faq="Частые вопросы",
               rights="Все права защищены.", contact="Получите бесплатную консультацию",
               contact_p="Подберем турникет и терминал для вашей школы или детского сада и рассчитаем стоимость.",
               links=[("/ru/", "Главная"), ("/ru/stati/", "Статьи"), ("/", "O'zbek tilida"), ("https://panel.schoolday.uz/privacy", "Конфиденциальность")]),
}

def page(p):
    lang, url, u = p["lang"], BASE + p["path"], UI[p["lang"]]
    alts = "".join(f'\n    <link rel="alternate" hreflang="{l}" href="{BASE}{h}">' for l, h in p["alternates"].items())
    if "uz" in p["alternates"]:
        alts += f'\n    <link rel="alternate" hreflang="x-default" href="{BASE}{p["alternates"]["uz"]}">'
    faq_ld = {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]}
    crumbs_ld = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + h} for i, (n, h) in enumerate(p["crumbs"])]}
    ld = json.dumps({"@context": "https://schema.org", "@graph": [p["schema"], faq_ld, crumbs_ld]}, ensure_ascii=False, indent=2)
    crumbs = " / ".join(f'<a href="{h}">{esc(n)}</a>' for n, h in p["crumbs"][:-1]) + f' / <span>{esc(p["crumbs"][-1][0])}</span>'
    cards = "".join(f'<div class="seo-card"><h3>{t}</h3><p>{d}</p></div>' for t, d in p["cards"])
    blocks = "".join(f'<section class="seo-section"><h2>{b["h2"]}</h2>{b["body"]}</section>' for b in p["blocks"])
    faq = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in p["faq"])
    links = "".join(f'<a href="{h}">{t}</a>' for h, t in u["links"])
    lang_links = "".join(f'<a class="lang-btn{" active" if l == lang else ""}" href="{h}" hreflang="{l}" style="text-decoration:none;">{l.upper()}</a>' for l, h in p["lang_nav"])

    return f'''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(p["title"])}</title>
    <meta name="description" content="{esc(p["desc"])}">
    <link rel="canonical" href="{url}">{alts}
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:site_name" content="SchoolDay">
    <meta property="og:locale" content="{"uz_UZ" if lang == "uz" else "ru_RU"}">
    <meta property="og:title" content="{esc(p["title"])}">
    <meta property="og:description" content="{esc(p["desc"])}">
    <meta property="og:image" content="{BASE}/image/logo.jpg">
    <meta name="twitter:card" content="summary">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="theme-color" content="#f97316">
    <link rel="stylesheet" href="/style.css?v=3">
    <style>{EXTRA_CSS}</style>
    <script type="application/ld+json">
{ld}
    </script>
</head>
<body>
    <div class="page-wrapper">
        <div class="bg-effects">
            <div class="blob blob--blue"></div>
            <div class="blob blob--indigo"></div>
            <div class="blob blob--orange"></div>
            <div class="bg-overlay"></div>
        </div>

        <header class="header">
            <a href="{"/" if lang == "uz" else "/ru/"}" class="logo">
                <div class="logo__icon"><img src="/image/logo.jpg" alt="SchoolDay" width="40" height="40" style="width:100%;height:100%;object-fit:cover;border-radius:.5rem;"></div>
                <span class="logo__text">SchoolDay</span>
            </a>
            <nav class="nav"><div class="lang-switcher">{lang_links}</div></nav>
        </header>

        <main class="hero" style="min-height:auto;">
            <div class="hero__container">
                <div class="hero__content">
                    <div class="crumbs">{crumbs}</div>
                    <div class="badge"><span class="badge__dot"><span class="badge__dot-ping"></span><span class="badge__dot-core"></span></span><span>{p["tag"]}</span></div>
                    <h1 class="heading">{p["h1a"]}<br><span class="heading__gradient">{p["h1b"]}</span></h1>
                    <p class="description">{p["lead"]}</p>
                    <div class="seo-cta">
                        <a class="seo-btn seo-btn--primary" href="tel:{PHONE}">{u["call"]}: {PHONE_TXT}</a>
                        <a class="seo-btn" href="https://panel.schoolday.uz">{u["login"]}</a>
                    </div>
                </div>
                <div class="hikvision-showcase">
                    <div class="hikvision-showcase__glow"></div>
                    <div class="hikvision-showcase__card">
                        <img src="/image/hikvision.jpg" width="400" height="334" alt="{esc(p["img_alt"])}" class="hikvision-showcase__img">
                        <div class="hikvision-showcase__label"><span class="hikvision-showcase__badge">Hikvision</span><span class="hikvision-showcase__text">Face Recognition Terminal</span></div>
                    </div>
                </div>
            </div>
        </main>

        <section class="seo-section" style="padding-bottom:0;"><h2>{p["cards_h2"]}</h2></section>
        <div class="seo-cards">{cards}</div>
        {blocks}
        <section class="seo-section seo-faq"><h2>{p["faq_h2"] if p.get("faq_h2") else u["faq"]}</h2>{faq}</section>
        <section class="seo-section" style="text-align:center;">
            <h2>{u["contact"]}</h2>
            <p>{u["contact_p"]}</p>
            <div class="seo-cta" style="justify-content:center;">
                <a class="seo-btn seo-btn--primary" href="tel:{PHONE}">{u["call"]}: {PHONE_TXT}</a>
                <a class="seo-btn" href="{TG}" rel="noopener">{u["tg"]}</a>
            </div>
        </section>

        <footer class="footer">
            <div class="seo-footer-links">{links}</div>
            &copy; 2026 SchoolDay. {u["rights"]}
        </footer>
    </div>
</body>
</html>
'''

APP = lambda lang, path, desc: {"@type": "SoftwareApplication", "name": "SchoolDay", "url": BASE + path, "inLanguage": lang,
                                "applicationCategory": "EducationalApplication", "operatingSystem": "Web, Android", "description": desc}

PAGES = [
  dict(lang="ru", path="/ru/", file="ru/index.html", alternates={"uz": "/", "ru": "/ru/"}, lang_nav=[("uz", "/"), ("ru", "/ru/")],
    title="Система посещаемости для школ и детских садов с Face ID — SchoolDay",
    desc="Учет посещаемости учеников по Face ID и турникету: терминалы Hikvision, мгновенные уведомления родителям в Telegram с фото, отчеты по классам. Для школ и детских садов Узбекистана.",
    crumbs=[("SchoolDay", "/ru/")],
    schema=APP("ru", "/ru/", "Система учета посещаемости для школ и детских садов: Face ID, турникеты, уведомления родителям в Telegram."),
    tag="Посещаемость · Face ID · Турникеты",
    h1a="Система посещаемости для школ", h1b="и детских садов с Face ID",
    lead="<strong>SchoolDay</strong> автоматически отмечает приход и уход каждого ученика через терминал Hikvision с распознаванием лиц или турникет. Родители сразу получают сообщение с фото в Telegram, а администрация видит посещаемость по классам в реальном времени.",
    img_alt="Терминал Hikvision с распознаванием лиц для учета посещаемости в школе",
    cards_h2="Возможности SchoolDay",
    cards=[
      ("Распознавание лиц", "Терминалы Hikvision узнают ученика за доли секунды — без карт, которые теряют или передают друг другу."),
      ("Турникет на входе", "Терминал открывает турникет только для учеников и сотрудников из базы — посторонние в школу не пройдут."),
      ("Telegram для родителей", "Когда ребенок входит или выходит из школы, родитель получает сообщение с фото и точным временем."),
      ("Классы и смены", "Ученики распределены по классам и сменам: видно, кто пришел, кто опоздал и кто отсутствует."),
      ("Отчеты", "Ежедневная и месячная посещаемость по классам и ученикам без бумажного журнала."),
      ("Несколько зданий", "Школа с несколькими корпусами или сеть детских садов — все устройства в одной панели."),
    ],
    blocks=[
      dict(h2="Как работает учет посещаемости в школе", body="""<ol>
        <li><strong>Оборудование.</strong> На входе устанавливается терминал Hikvision с Face ID — отдельно или вместе с турникетом. Уже установленный турникет можно использовать.</li>
        <li><strong>Облако.</strong> Терминал подключается к SchoolDay через интернет, сервер в школе не нужен.</li>
        <li><strong>Ученики и родители.</strong> Администрация добавляет учеников с фото, родители один раз подключаются к Telegram-боту по номеру телефона.</li>
        <li><strong>Каждый день.</strong> Ученик проходит через терминал — посещаемость фиксируется, а родитель получает уведомление.</li></ol>"""),
      dict(h2="Почему родители выбирают SchoolDay", body="""<p>Родителю не нужно ждать конца дня или звонить учителю: сообщение с фото приходит в Telegram в момент, когда ребенок прошел через вход. Это спокойствие для семьи и меньше вопросов к администрации.</p>
        <p>Для учета рабочего времени сотрудников в компаниях у нас есть отдельная система — <a href="https://payday.uz/ru/">PayDay</a>.</p>"""),
    ],
    faq_h2="Вопросы о системе посещаемости",
    faq=[
      ("Как родители получают уведомления?", "Родитель один раз отправляет свой номер телефона Telegram-боту SchoolDay. После этого при каждом входе и выходе ребенка приходит сообщение с фото и временем."),
      ("Нужен ли турникет?", "Нет, можно установить только терминал Face ID на входе. Турникет добавляется, если нужно ограничить проход посторонним."),
      ("Подходит ли система для детского сада?", "Да. SchoolDay работает в школах и детских садах: группы настраиваются так же, как классы."),
      ("Можно ли подключить существующий турникет?", "Да. Терминал Hikvision подключается к контроллеру турникета и открывает его после распознавания лица."),
      ("Нужен ли сервер в школе?", "Нет. Терминал передает данные в облако через интернет, администрация работает через браузер или приложение."),
    ]),

  dict(lang="uz", path="/maktab-turniket/", file="maktab-turniket/index.html", alternates={"uz": "/maktab-turniket/"}, lang_nav=[("uz", "/"), ("ru", "/ru/")],
    title="Maktab va bog'cha uchun turniket va Face ID davomat — SchoolDay",
    desc="Maktab va bog'chaga turniket o'rnatish va yuzni tanish orqali o'quvchilar davomati: o'quvchi kirganda ota-onasiga Telegram orqali rasmli xabar boradi. Hikvision terminallari, sinflar bo'yicha hisobot.",
    crumbs=[("SchoolDay", "/"), ("Maktab uchun turniket", "/maktab-turniket/")],
    schema={"@type": "Service", "name": "Maktab va bog'cha uchun turniket va Face ID davomat", "serviceType": "Maktabga turniket va yuz tanish terminali o'rnatish",
            "provider": {"@type": "Organization", "name": "SchoolDay", "url": BASE + "/"}, "areaServed": {"@type": "Country", "name": "Uzbekistan"}, "url": BASE + "/maktab-turniket/"},
    tag="Maktab · Bog'cha · Turniket · Face ID",
    h1a="Maktab va bog'cha uchun", h1b="turniket va Face ID davomat",
    lead="O'quvchi yuzini terminalga ko'rsatadi — <strong>turniket ochiladi</strong>, davomat yoziladi va <strong>ota-onasiga Telegram orqali rasmli xabar</strong> boradi. SchoolDay Hikvision yuz tanish terminallarini yangi yoki mavjud turniketingizga ulaydi.",
    img_alt="Maktab kirishidagi Hikvision yuz tanish terminali va turniket",
    cards_h2="Maktabga turniket va Face ID nima beradi",
    cards=[
      ("Begonalar kirmaydi", "Turniket faqat bazadagi o'quvchi va xodimlar uchun ochiladi — maktab xavfsizligi oshadi."),
      ("Yuzni tanish", "Karta yoki kalit kerak emas: o'quvchi kartasini yo'qotmaydi va boshqaga bera olmaydi."),
      ("Ota-onaga Telegram xabar", "Farzand maktabga kirganda va chiqqanda ota-ona darhol rasm va vaqt bilan xabar oladi."),
      ("Sinflar bo'yicha davomat", "Kim keldi, kim kechikdi, kim kelmadi — har bir sinf va smena bo'yicha real vaqtda."),
      ("Avtomatik hisobot", "Kunlik va oylik davomat qog'oz jurnalsiz, bir tugma bilan."),
      ("Har qanday turniket", "Tripod, kalitka va flap turniketlar hamda eshikdagi elektromagnit qulflar bilan ishlaydi."),
    ],
    blocks=[
      dict(h2="Maktabga turniket qanday o'rnatiladi", body="""<ol>
        <li><strong>Ko'rib chiqamiz.</strong> Kirishlar soni, o'quvchilar soni va mavjud uskunaga qarab komplekt tanlaymiz.</li>
        <li><strong>O'rnatamiz.</strong> Turniket va Hikvision Face ID terminali montaj qilinadi. Turniket bo'lsa, faqat terminal qo'shiladi.</li>
        <li><strong>Bulutga ulaymiz.</strong> Terminal internet orqali SchoolDay'ga ulanadi — maktabda server yoki kompyuter kerak emas.</li>
        <li><strong>O'quvchilar va ota-onalar.</strong> O'quvchilar rasmi bilan qo'shiladi, ota-onalar telefon raqami orqali Telegram botga bir marta ulanadi.</li></ol>"""),
      dict(h2="Nima uchun Telegram xabarnoma muhim", body="""<p>Ota-ona kun oxirini kutmaydi va o'qituvchiga qo'ng'iroq qilmaydi: farzandi maktab eshigidan o'tgan zahoti Telegram'da rasm bilan xabar keladi. Bu oilaga xotirjamlik, maktab ma'muriyatiga esa kamroq savol.</p>
        <p>Turniket narxi uning turi va kirishlar soniga bog'liq — qo'ng'iroq qiling, maktabingiz uchun bepul hisob-kitob qilamiz. Korxonalarda xodimlar davomati uchun alohida tizimimiz bor — <a href="https://payday.uz/turniket/">PayDay</a>.</p>"""),
    ],
    faq_h2="Maktab turniketi va Face ID haqida savollar",
    faq=[
      ("Ota-onalar xabarni qanday oladi?", "Ota-ona SchoolDay Telegram botiga telefon raqamini bir marta yuboradi. Shundan keyin farzandi har kirib-chiqqanda rasm va vaqt bilan xabar keladi."),
      ("Turniketsiz ham ishlaydimi?", "Ha, kirishga faqat Face ID terminali o'rnatish mumkin. Begonalarni kiritmaslik kerak bo'lsa, turniket qo'shiladi."),
      ("Bog'cha uchun mos keladimi?", "Ha. SchoolDay maktab va bog'chalarda ishlaydi, guruhlar sinflar kabi sozlanadi."),
      ("Mavjud turniketimizga ulasa bo'ladimi?", "Ha. Hikvision terminali turniket kontrolleriga ulanadi va yuzni tanigandan keyin turniketni ochadi."),
      ("Maktabga turniket o'rnatish narxi qancha?", "Narx turniket turi, kirishlar soni va terminal modeliga bog'liq. Qo'ng'iroq qiling yoki Telegramga yozing — bepul hisoblab beramiz."),
    ]),
]


def build():
    for p in PAGES:
        path = os.path.join(OUT, p["file"])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        open(path, "w").write(page(p))
        print("wrote", p["file"], len(p["title"]), len(p["desc"]))


if __name__ == "__main__":
    build()
