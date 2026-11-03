"""schoolday.uz maqolalari (blog) generatori.

Yangi maqola qo'shish: ARTICLES ro'yxatiga yangi dict qo'shing va ishga tushiring:
    python3 scripts/landing/articles.py
Natija: landing/maqolalar/<slug>/ (uz) va landing/ru/stati/<slug>/ (ru), ro'yxat sahifalari va landing/sitemap.xml.
"""
import json, os

from pages import BASE, EXTRA_CSS, OUT, PHONE, PHONE_TXT, TG, UI, esc

TODAY = "2026-11-03"

ARTICLES = [
  # ============================================================ UZ
  dict(lang="uz", slug="maktabda-elektron-davomat", date=TODAY,
    title="Maktabda elektron davomat: qanday ishlaydi va nima beradi",
    desc="Maktabda elektron davomat tizimi qanday ishlaydi: Face ID terminali, turniket, sinflar bo'yicha hisobot va ota-onalarga Telegram xabar. Qog'oz jurnaldan farqi va joriy etish bosqichlari.",
    lead="Qog'oz jurnalda davomat har dars boshida qo'lda belgilanadi, xatolar va \"unutib qo'yildi\" holatlari ko'p. Elektron davomat bu jarayonni avtomatlashtiradi: o'quvchi maktabga kirgan zahoti tizim buni qayd etadi.",
    body="""
<h2>Elektron davomat qanday ishlaydi?</h2>
<p>Maktab kirishiga yuzni tanish terminali o'rnatiladi. O'quvchi terminalga qaraydi — tizim uni taniydi va kelgan vaqtini yozadi. Maktabdan chiqishda ham xuddi shunday. Ma'lumot internet orqali bulutga tushadi, ma'muriyat esa uni brauzer yoki telefon orqali ko'radi.</p>

<h2>Qog'oz jurnaldan farqi</h2>
<ul>
<li><strong>Vaqt tejaladi</strong> — o'qituvchi dars boshida yo'qlama qilishga vaqt sarflamaydi.</li>
<li><strong>Aniq vaqt</strong> — o'quvchi soat nechada kelgani va ketgani daqiqasigacha ma'lum.</li>
<li><strong>Kechikishlar ko'rinadi</strong> — kim muntazam kechikayotgani hisobotda darhol ko'zga tashlanadi.</li>
<li><strong>Ota-ona xabardor</strong> — farzandi maktabga kirganda ota-onasiga xabar boradi.</li>
</ul>

<h2>Sinflar va smenalar bo'yicha hisobot</h2>
<p>O'quvchilar sinflar va smenalarga biriktiriladi. Shunda direktor yoki sinf rahbari bir qarashda ko'radi: bugun qaysi sinfdan kim keldi, kim kechikdi, kim kelmadi. Oylik hisobot ham bir tugma bilan tayyor bo'ladi.</p>

<h2>Turniket kerakmi?</h2>
<p>Shart emas. Faqat Face ID terminalining o'zi davomat uchun yetarli. Agar maktabga begonalar kirmasligi muhim bo'lsa, terminal <a href="/maktab-turniket/">turniketga ulanadi</a> va u faqat bazadagi o'quvchi va xodimlar uchun ochiladi.</p>

<h2>Joriy etish bosqichlari</h2>
<ol>
<li>Kirishlar sonini va o'quvchilar sonini aniqlash.</li>
<li>Terminal (va kerak bo'lsa turniket) o'rnatish.</li>
<li>O'quvchilarni rasmi bilan tizimga kiritish va sinflarga biriktirish.</li>
<li>Ota-onalarni Telegram botga ulash.</li>
</ol>
<p>SchoolDay shu bosqichlarning barchasini bitta tizimda birlashtiradi. Batafsil: <a href="/">SchoolDay davomat tizimi</a>.</p>
"""),

  dict(lang="uz", slug="maktabga-turniket-ornatish", date=TODAY,
    title="Maktabga turniket o'rnatish: 7 ta muhim savol",
    desc="Maktab yoki bog'chaga turniket o'rnatishdan oldin javob berish kerak bo'lgan 7 ta savol: turniket turi, o'tish oqimi, Face ID yoki karta, favqulodda chiqish, ota-onalar va narx.",
    lead="Maktabga turniket o'rnatish — faqat uskuna sotib olish emas. Ertalab yuzlab o'quvchi bir vaqtda kiradi, bolalar kartani yo'qotadi, favqulodda vaziyatda esa hamma tez chiqa olishi kerak. Rejalashtirishdan oldin quyidagi savollarga javob bering.",
    body="""
<h2>1. Ertalab nechta o'quvchi bir vaqtda kiradi?</h2>
<p>Dars boshlanishidan oldingi 15–20 daqiqada asosiy oqim bo'ladi. Shunga qarab yo'laklar soni tanlanadi: bitta yo'lak bilan katta maktabda navbat hosil bo'ladi.</p>

<h2>2. Qaysi turdagi turniket?</h2>
<p>Maktablarda ko'pincha <strong>tripod</strong> turniket va uning yonida keng <strong>kalitka</strong> o'rnatiladi — kalitka ota-onalar, aravachalar va yuk uchun. Zamonaviy binolarda shaffof qanotli (flap) turniketlar ham ishlatiladi.</p>

<h2>3. Karta, barmoq izi yoki Face ID?</h2>
<p>Bolalar kartani yo'qotadi, unutadi yoki do'stiga beradi. Barmoq izi skaneriga yuzlab bola tegadi. Yuzni tanish (Face ID) esa kontaktsiz: o'quvchi faqat terminalga qaraydi, hech narsa olib yurish shart emas.</p>

<h2>4. Mavjud turniketdan foydalansa bo'ladimi?</h2>
<p>Ha. Ko'p hollarda turniketni almashtirish shart emas — unga Face ID terminali ulanadi va u yuz tanilgandan keyin turniketni ochadi.</p>

<h2>5. Favqulodda vaziyatda nima bo'ladi?</h2>
<p>Elektr uzilganda yoki yong'in signalida turniket o'tishni bloklamasligi kerak. O'rnatishdan oldin bu rejimni albatta tekshiring va evakuatsiya yo'llarini oldindan rejalashtiring.</p>

<h2>6. Ota-onalar qanday xabar oladi?</h2>
<p>Turniket davomat tizimiga ulansa, har bir o'tish qayd etiladi. SchoolDay'da ota-ona Telegram botga telefon raqamini bir marta yuboradi — shundan keyin farzandi kirib-chiqqanda rasm va vaqt bilan xabar keladi.</p>

<h2>7. Narxi nimaga bog'liq?</h2>
<p>Turniket turi, yo'laklar soni, terminal modeli va montaj ishlariga. Mavjud turniket bo'lsa, faqat terminal qo'shiladi va xarajat ancha kamayadi.</p>
<p>Maktabingiz uchun komplekt tanlashda yordam beramiz — <a href="/maktab-turniket/">maktab uchun turniket va Face ID</a> sahifasini ko'ring.</p>
"""),

  dict(lang="uz", slug="farzandim-maktabga-keldimi", date=TODAY,
    title="Farzandingiz maktabga kelganini qanday bilish mumkin",
    desc="Ota-onalar farzandining maktabga kelgani va ketganini qanday bilishi mumkin: Telegram orqali rasmli xabar, Face ID terminali va sinf guruhlari. SchoolDay qanday ishlaydi.",
    lead="\"Maktabga yetib bordimi?\" — ko'p ota-onalar har kuni shu savolni beradi. Qo'ng'iroq qilish har doim ham qulay emas, o'qituvchiga yozish esa uni darsdan chalg'itadi. Bu savolga avtomatik javob olish mumkin.",
    body="""
<h2>Muammo nimada?</h2>
<p>Bola maktabga yo'lda ketdi, lekin darsga kelmadi — ota-ona buni ko'pincha kech, ba'zan faqat kun oxirida biladi. Kichik sinf o'quvchilari va bog'cha bolalari uchun bu ayniqsa muhim.</p>

<h2>Yechim: kirishda avtomatik qayd va Telegram xabar</h2>
<p>Maktab kirishiga yuzni tanish terminali o'rnatiladi. O'quvchi terminal oldidan o'tganda tizim uni taniydi va shu zahoti ota-onasiga Telegram orqali xabar yuboradi. Xabarda:</p>
<ul>
<li>o'quvchining ismi va sinfi,</li>
<li>kirgan yoki chiqqan vaqti,</li>
<li>terminal olgan rasm.</li>
</ul>
<p>Rasm muhim: ota-ona xabar haqiqatan o'z farzandi haqida ekanini ko'radi.</p>

<h2>Ota-ona qanday ulanadi?</h2>
<p>Hech qanday ilova o'rnatish shart emas. Ota-ona SchoolDay Telegram botini ochib, telefon raqamini yuboradi. Raqam maktab bazasidagi o'quvchi ma'lumotiga mos kelsa, xabarlar avtomatik kela boshlaydi.</p>

<h2>Sinf guruhiga ham xabar</h2>
<p>Sinf rahbari xohlasa, sinfning Telegram guruhiga ham xabarlar keladi — shunda u kim kelgani va kim kelmaganini bir joyda ko'radi.</p>

<h2>Maxfiylik haqida</h2>
<p>Xabar faqat o'quvchining o'z ota-onasiga va maktab belgilagan guruhga boradi. O'quvchilar rasmlari Google kabi qidiruv tizimlarida indekslanmaydi.</p>
<p>Maktabingizda shunday tizim bo'lishini istaysizmi? <a href="/">SchoolDay</a> haqida batafsil o'qing yoki biz bilan bog'laning.</p>
"""),

  dict(lang="uz", slug="bogcha-davomat-va-xavfsizlik", date=TODAY,
    title="Bog'chada bolalar davomati va xavfsizligi: zamonaviy yechimlar",
    desc="Bog'chada bolalar davomatini qanday yuritish va xavfsizlikni oshirish mumkin: Face ID terminali, kirish nazorati, ota-onalarga Telegram xabar va guruhlar bo'yicha hisobot.",
    lead="Bog'chada davomat faqat hisobot uchun emas — bu birinchi navbatda bolalar xavfsizligi. Kim keldi, kim olib ketdi va binoga kim kirdi — tarbiyachi va mudira buni har doim bilishi kerak.",
    body="""
<h2>Bog'chada davomatning o'ziga xosligi</h2>
<p>Bolalarni ota-onalar olib keladi va olib ketadi, guruhlar kichik, ish kuni esa uzun. Qog'oz ro'yxat tarbiyachining vaqtini oladi, xatolar esa ko'p bo'ladi — ayniqsa ertalabki gavjum paytda.</p>

<h2>Face ID terminali bilan davomat</h2>
<p>Kirishga yuzni tanish terminali o'rnatiladi. Bola (yoki uni olib kelgan xodim) terminal oldidan o'tganda davomat avtomatik yoziladi. Karta yoki kalit kerak emas — bolalar ularni tez yo'qotadi.</p>

<h2>Kirish nazorati</h2>
<p>Terminal eshikdagi elektromagnit qulf yoki kalitka bilan ishlaganda u faqat bazadagi odamlar uchun ochiladi. Bu bog'cha hududiga begonalar kirishini cheklaydi.</p>

<h2>Ota-onalar uchun xotirjamlik</h2>
<p>Farzandi bog'chaga kirgan va chiqqan zahoti ota-onaga Telegram orqali rasm va vaqt bilan xabar boradi. Ish joyidagi ota-ona bolasi joyida ekanini darhol biladi.</p>

<h2>Guruhlar bo'yicha hisobot</h2>
<p>Mudira har bir guruh bo'yicha kunlik va oylik davomatni ko'radi: qaysi bola necha kun kelgani, kim kasal yoki uzrli sabab bilan kelmagani. Bu ovqatlanish va to'lovlarni rejalashtirishni ham osonlashtiradi.</p>

<h2>Qanday boshlash kerak?</h2>
<ol>
<li>Kirish eshigi va guruhlar sonini aniqlang.</li>
<li>Terminal o'rnating (kerak bo'lsa, qulf yoki kalitka bilan).</li>
<li>Bolalarni rasmi bilan guruhlarga kiriting.</li>
<li>Ota-onalarni Telegram botga ulang.</li>
</ol>
<p>SchoolDay maktab va bog'chalar uchun mo'ljallangan — <a href="/maktab-turniket/">turniket va Face ID yechimlarimiz</a> bilan tanishing.</p>
"""),

  # ============================================================ RU
  dict(lang="ru", slug="elektronnaya-poseshchaemost-v-shkole", date=TODAY,
    title="Электронная посещаемость в школе: как это работает",
    desc="Как работает электронный учет посещаемости в школе: терминал Face ID, турникет, отчеты по классам и уведомления родителям в Telegram. Чем отличается от бумажного журнала.",
    lead="В бумажном журнале посещаемость отмечают вручную в начале урока — это отнимает время и дает ошибки. Электронная посещаемость фиксирует приход ученика автоматически, в момент, когда он входит в школу.",
    body="""
<h2>Как это устроено</h2>
<p>На входе устанавливается терминал распознавания лиц. Ученик смотрит в камеру — система узнает его и записывает время прихода, при выходе — время ухода. Данные через интернет попадают в облако, администрация видит их в браузере или на телефоне.</p>

<h2>Чем лучше бумажного журнала</h2>
<ul>
<li><strong>Экономия времени</strong> — учителю не нужно делать перекличку.</li>
<li><strong>Точное время</strong> — видно, во сколько ученик пришел и ушел.</li>
<li><strong>Опоздания на виду</strong> — систематические опоздания сразу заметны в отчете.</li>
<li><strong>Родители в курсе</strong> — при входе ребенка родитель получает сообщение.</li>
</ul>

<h2>Уведомления родителям в Telegram</h2>
<p>Родитель один раз отправляет свой номер телефона Telegram-боту SchoolDay. После этого при каждом входе и выходе ребенка приходит сообщение с фото, временем и классом. Приложение устанавливать не нужно.</p>

<h2>Нужен ли турникет?</h2>
<p>Нет — для учета достаточно терминала Face ID. Турникет добавляют, если нужно не пускать посторонних: терминал открывает его только для учеников и сотрудников из базы. Уже установленный турникет обычно можно подключить.</p>

<h2>Отчеты по классам и сменам</h2>
<p>Ученики распределены по классам и сменам, поэтому директор и классный руководитель видят, кто пришел, кто опоздал и кто отсутствует, а месячный отчет формируется одной кнопкой.</p>
<p>Подробнее — на странице <a href="/ru/">SchoolDay: система посещаемости для школ и детских садов</a>.</p>
"""),
]

UI_A = {
    "uz": dict(index_path="/maqolalar/", index_title="Maqolalar: maktab davomati, turniket va xavfsizlik — SchoolDay",
               index_h1="Maqolalar", index_desc="Maktab va bog'chalarda elektron davomat, turniketlar, Face ID va bolalar xavfsizligi bo'yicha foydali maqolalar.",
               home=("SchoolDay", "/"), read="O'qish →", related="Boshqa maqolalar", date="Sana",
               cta_h="Maktabingiz uchun bepul maslahat", cta_p="Qaysi terminal va turniket kerakligini aniqlab, narxini hisoblab beramiz.",
               lang_nav=[("uz", "/maqolalar/"), ("ru", "/ru/stati/")]),
    "ru": dict(index_path="/ru/stati/", index_title="Статьи: посещаемость в школе, турникеты и безопасность — SchoolDay",
               index_h1="Статьи", index_desc="Полезные статьи об электронной посещаемости, турникетах и безопасности в школах и детских садах.",
               home=("SchoolDay", "/ru/"), read="Читать →", related="Другие статьи", date="Дата",
               cta_h="Бесплатная консультация для вашей школы", cta_p="Подберем терминал и турникет и рассчитаем стоимость.",
               lang_nav=[("uz", "/maqolalar/"), ("ru", "/ru/stati/")]),
}

ARTICLE_CSS = """
    .article{max-width:760px;margin:0 auto;padding:7rem 1.5rem 1rem;position:relative;z-index:1;color:var(--text-light);font-size:1.08rem;line-height:1.8}
    .article h1{font-size:clamp(1.9rem,4vw,2.6rem);font-weight:800;color:var(--heading-color);line-height:1.2;margin-bottom:.75rem}
    .article h2{font-size:1.45rem;font-weight:700;color:var(--heading-color);margin:2.2rem 0 .8rem;line-height:1.3}
    .article p{margin:0 0 1rem}
    .article ul,.article ol{margin:0 0 1rem 1.2rem}
    .article li{margin-bottom:.5rem}
    .article a{color:#f97316}
    .article .lead{font-size:1.2rem;color:var(--heading-color);margin-top:1.5rem}
    .article-meta{font-size:.9rem;color:var(--text-lighter)}
    .article-list{display:grid;gap:1rem;max-width:860px;margin:0 auto;padding:0 1.5rem 2rem;position:relative;z-index:1}
    .article-card{display:block;padding:1.5rem;border-radius:1rem;border:1px solid var(--card-border);background:var(--card-bg);text-decoration:none;backdrop-filter:blur(12px)}
    .article-card h2,.article-card h3{color:var(--heading-color);font-size:1.2rem;margin:0 0 .5rem}
    .article-card p{color:var(--text-light);margin:0 0 .6rem}
    .article-card span{color:#f97316;font-weight:600}
"""

def url_of(a):
    return f"/maqolalar/{a['slug']}/" if a["lang"] == "uz" else f"/ru/stati/{a['slug']}/"

def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": BASE + h} for i, (n, h) in enumerate(items)]}

def crumbs_html(items):
    return " / ".join(f'<a href="{h}">{esc(n)}</a>' for n, h in items[:-1]) + f" / <span>{esc(items[-1][0])}</span>"

def shell(lang, title, desc, path, ld, main, alt=None, og_type="website"):
    u, ua = UI[lang], UI_A[lang]
    alts = "".join(f'\n    <link rel="alternate" hreflang="{l}" href="{BASE}{h}">' for l, h in (alt or {}).items())
    lang_links = "".join(f'<a class="lang-btn{" active" if l == lang else ""}" href="{h}" hreflang="{l}" style="text-decoration:none;">{l.upper()}</a>' for l, h in ua["lang_nav"])
    links = "".join(f'<a href="{h}">{t}</a>' for h, t in u["links"]) + f'<a href="{ua["index_path"]}">{ua["index_h1"]}</a>'
    ldj = json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False, indent=2)
    return f'''<!DOCTYPE html>
<html lang="{lang}" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{esc(title)}</title>
    <meta name="description" content="{esc(desc)}">
    <link rel="canonical" href="{BASE}{path}">{alts}
    <meta property="og:type" content="{og_type}">
    <meta property="og:url" content="{BASE}{path}">
    <meta property="og:site_name" content="SchoolDay">
    <meta property="og:locale" content="{"uz_UZ" if lang == "uz" else "ru_RU"}">
    <meta property="og:title" content="{esc(title)}">
    <meta property="og:description" content="{esc(desc)}">
    <meta property="og:image" content="{BASE}/image/logo.jpg">
    <meta name="twitter:card" content="summary">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <meta name="theme-color" content="#f97316">
    <link rel="stylesheet" href="/style.css?v=3">
    <style>{EXTRA_CSS}{ARTICLE_CSS}</style>
    <script type="application/ld+json">
{ldj}
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
            <a href="{ua["home"][1]}" class="logo">
                <div class="logo__icon"><img src="/image/logo.jpg" alt="SchoolDay" width="40" height="40" style="width:100%;height:100%;object-fit:cover;border-radius:.5rem;"></div>
                <span class="logo__text">SchoolDay</span>
            </a>
            <nav class="nav"><div class="lang-switcher">{lang_links}</div></nav>
        </header>
{main}
        <section class="seo-section" style="text-align:center;">
            <h2>{ua["cta_h"]}</h2>
            <p>{ua["cta_p"]}</p>
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

def article_page(a, siblings):
    ua, lang, path = UI_A[a["lang"]], a["lang"], url_of(a)
    crumbs = [ua["home"], (ua["index_h1"], ua["index_path"]), (a["title"], path)]
    ld = [{"@type": "BlogPosting", "headline": a["title"], "description": a["desc"], "inLanguage": lang,
           "datePublished": a["date"], "dateModified": a.get("updated", a["date"]), "mainEntityOfPage": BASE + path,
           "image": BASE + "/image/logo.jpg",
           "author": {"@type": "Organization", "name": "SchoolDay", "url": BASE + "/"},
           "publisher": {"@type": "Organization", "name": "SchoolDay", "logo": {"@type": "ImageObject", "url": BASE + "/image/logo.jpg"}}},
          crumbs_ld(crumbs)]
    related = "".join(f'<a class="article-card" href="{url_of(s)}"><h3>{esc(s["title"])}</h3><span>{ua["read"]}</span></a>' for s in siblings if s is not a)
    main = f'''
        <article class="article">
            <div class="crumbs">{crumbs_html(crumbs)}</div>
            <h1>{esc(a["title"])}</h1>
            <div class="article-meta">{ua["date"]}: <time datetime="{a["date"]}">{a["date"]}</time></div>
            <p class="lead">{esc(a["lead"])}</p>
            {a["body"]}
        </article>
''' + (f'''
        <section class="seo-section" style="padding-bottom:1rem;"><h2>{ua["related"]}</h2></section>
        <div class="article-list">{related}</div>''' if related else "")
    return shell(lang, a["title"], a["desc"], path, ld, main, og_type="article")

def index_page(lang, items):
    ua = UI_A[lang]
    crumbs = [ua["home"], (ua["index_h1"], ua["index_path"])]
    ld = [{"@type": "CollectionPage", "name": ua["index_title"], "url": BASE + ua["index_path"], "inLanguage": lang,
           "hasPart": [{"@type": "BlogPosting", "headline": a["title"], "url": BASE + url_of(a)} for a in items]}, crumbs_ld(crumbs)]
    cards = "".join(f'<a class="article-card" href="{url_of(a)}"><h2>{esc(a["title"])}</h2><p>{esc(a["desc"])}</p><span>{ua["read"]}</span></a>' for a in items)
    main = f'''
        <div class="article" style="padding-bottom:0;">
            <div class="crumbs">{crumbs_html(crumbs)}</div>
            <h1>{ua["index_h1"]}</h1>
            <p class="lead" style="margin-top:.5rem;">{ua["index_desc"]}</p>
        </div>
        <div class="article-list">{cards}</div>'''
    return shell(lang, ua["index_title"], ua["index_desc"], ua["index_path"], ld, main, alt={"uz": "/maqolalar/", "ru": "/ru/stati/"})

def write(rel, content):
    path = os.path.join(OUT, rel.strip("/"), "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(content)
    print("wrote", rel)

def sitemap():
    pairs = [("/", {"uz": "/", "ru": "/ru/"}), ("/ru/", {"uz": "/", "ru": "/ru/"}), ("/maktab-turniket/", None),
             ("/maqolalar/", {"uz": "/maqolalar/", "ru": "/ru/stati/"}), ("/ru/stati/", {"uz": "/maqolalar/", "ru": "/ru/stati/"})]
    rows = []
    for loc, alts in pairs:
        links = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{l}" href="{BASE}{h}"/>' for l, h in (alts or {}).items())
        rows.append(f"  <url>\n    <loc>{BASE}{loc}</loc>\n    <lastmod>{TODAY}</lastmod>{links}\n  </url>")
    for a in ARTICLES:
        rows.append(f"  <url>\n    <loc>{BASE}{url_of(a)}</loc>\n    <lastmod>{a.get('updated', a['date'])}</lastmod>\n  </url>")
    rows.append(f"  <url>\n    <loc>https://panel.schoolday.uz/privacy</loc>\n    <lastmod>{TODAY}</lastmod>\n  </url>")
    open(os.path.join(OUT, "sitemap.xml"), "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(rows) + "\n</urlset>\n")
    print("wrote sitemap.xml", len(rows), "urls")

if __name__ == "__main__":
    for lang in ("uz", "ru"):
        items = [a for a in ARTICLES if a["lang"] == lang]
        write(UI_A[lang]["index_path"], index_page(lang, items))
        for a in items:
            write(url_of(a), article_page(a, items))
    sitemap()
