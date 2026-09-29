import { Head, Link, usePage } from '@inertiajs/react';
import { Moon, Sun, Phone, Send, MessageCircle, Activity } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '@/hooks/use-appearance';

export default function Welcome() {
    const { auth } = usePage().props;
    const year = new Date().getFullYear();
    const { t, i18n } = useTranslation();
    const { appearance, updateAppearance } = useAppearance();
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const toggleTheme = () => {
        const isDark =
            appearance === 'dark' ||
            (appearance === 'system' &&
                window.matchMedia('(prefers-color-scheme: dark)').matches);
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <>
            <Head>
                <title>{t('seo.welcome_title')}</title>
                <meta
                    name="description"
                    content={t('seo.welcome_description')}
                />
                <meta name="keywords" content={t('seo.welcome_keywords')} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={window.location.href} />
                <meta property="og:title" content={t('seo.og_title')} />
                <meta
                    property="og:description"
                    content={t('seo.og_description')}
                />
                <meta property="og:image" content="/images/og-image.jpg" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content={window.location.href} />
                <meta property="twitter:title" content={t('seo.og_title')} />
                <meta
                    property="twitter:description"
                    content={t('seo.og_description')}
                />
                <meta property="twitter:image" content="/images/og-image.jpg" />

                <link rel="canonical" href={window.location.href} />
            </Head>
            <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-slate-50 font-sans text-slate-800 transition-colors duration-300 selection:bg-orange-500 selection:text-white dark:bg-slate-900 dark:text-slate-100">
                {/* Immersive Background Effects */}
                <div className="pointer-events-none absolute inset-0 z-0">
                    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/10 blur-[128px] dark:bg-blue-600/20"></div>
                    <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[128px] dark:bg-indigo-500/10"></div>
                    <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[128px] dark:bg-orange-500/20"></div>
                    <div className="absolute inset-0 bg-white/20 mix-blend-overlay backdrop-blur-[1px] dark:bg-[#0f172a]/20"></div>
                </div>

                {/* Header Navigation */}
                <header
                    className={`fixed top-0 z-100 flex w-full justify-center transition-all duration-300 ${isScrolled ? 'border-b border-black/5 bg-white/80 py-3 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80' : 'bg-transparent py-6'}`}
                >
                    <div className="flex w-full max-w-7xl items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-xl shadow-lg shadow-orange-500/30">
                                <img
                                    src="/image/logo.jpg"
                                    alt="SchoolDay Logo"
                                    className="h-10 w-10 object-cover"
                                />
                            </div>
                            <span className="hidden text-2xl font-bold tracking-tight text-slate-900 sm:block dark:text-white">
                                SchoolDay
                            </span>
                        </div>

                        <nav className="flex items-center gap-2 sm:gap-4">
                            <Link
                                href="/monitoring"
                                className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-500/20 hover:text-emerald-700 md:flex dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                                <Activity className="h-4 w-4" />
                                Monitoring
                            </Link>
                            <a
                                href="#contact"
                                className="hidden px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-orange-500 md:block dark:text-slate-300 dark:hover:text-orange-400"
                            >
                                {t('welcome.contact_nav', "Bog'lanish")}
                            </a>

                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center rounded-full border border-black/5 bg-black/5 p-2 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:bg-black/10 hover:text-slate-900 sm:px-3 sm:py-2.5 dark:border-white/10 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20 dark:hover:text-white"
                                aria-label="Toggle theme"
                            >
                                <Sun className="hidden h-4 w-4 dark:block" />
                                <Moon className="block h-4 w-4 dark:hidden" />
                            </button>

                            <div className="flex rounded-full border border-black/5 bg-black/5 p-1 backdrop-blur-md dark:border-white/10 dark:bg-white/10">
                                <button
                                    onClick={() => changeLanguage('uz')}
                                    className={`rounded-full px-3 py-1 text-xs transition-colors sm:text-sm ${i18n.language === 'uz' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                                >
                                    UZ
                                </button>
                                <button
                                    onClick={() => changeLanguage('ru')}
                                    className={`rounded-full px-3 py-1 text-xs transition-colors sm:text-sm ${i18n.language === 'ru' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                                >
                                    RU
                                </button>
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className={`rounded-full px-3 py-1 text-xs transition-colors sm:text-sm ${i18n.language === 'en' ? 'bg-orange-500 text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                                >
                                    EN
                                </button>
                            </div>

                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="rounded-full border border-black/5 bg-black/5 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-md transition-all hover:bg-black/10 sm:px-6 sm:py-2.5 sm:text-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                >
                                    {t('welcome.dashboard', 'Dashboard')}
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="rounded-full border border-black/5 bg-black/5 px-4 py-2 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-md transition-all hover:bg-black/10 sm:px-6 sm:py-2.5 sm:text-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
                                >
                                    {t('welcome.login', 'Log in')}
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero Content */}
                <main className="z-10 flex w-full max-w-7xl flex-col items-center px-6 pt-32 sm:pt-40 lg:pt-48">
                    <div className="mb-20 flex w-full flex-col items-center justify-between gap-12 lg:flex-row lg:gap-10">
                        <div className="flex max-w-2xl flex-col items-center text-center lg:items-start lg:text-left">
                            <div className="mb-6 inline-flex cursor-default items-center gap-2 rounded-full border border-black/5 bg-black/5 px-4 py-2 text-xs text-orange-600 shadow-inner backdrop-blur-sm transition-all hover:bg-black/10 sm:text-sm dark:border-white/10 dark:bg-white/5 dark:text-orange-200 dark:hover:bg-white/10">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
                                </span>
                                {t(
                                    'welcome.badge',
                                    'Next Generation School Management',
                                )}
                            </div>

                            <h1 className="mb-6 text-4xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
                                {t(
                                    'welcome.heading_part1',
                                    'Manage your school with',
                                )}{' '}
                                <br className="hidden md:block" />
                                <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-indigo-400 bg-clip-text text-transparent">
                                    {t(
                                        'welcome.heading_part2',
                                        'ultimate precision',
                                    )}
                                </span>
                            </h1>

                            <p className="mb-8 max-w-xl text-base leading-relaxed font-light text-slate-600 sm:text-lg md:text-xl dark:text-slate-300">
                                {t(
                                    'welcome.description',
                                    'SchoolDay provides a highly integrated ecosystem for attendance tracking, intelligent student management, and real-time Hikvision access control.',
                                )}
                            </p>

                            <div className="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row sm:gap-5 lg:justify-start">
                                {auth.user ? (
                                    <Link
                                        href="/dashboard"
                                        className="w-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] transition-all duration-300 hover:-translate-y-1 hover:from-orange-600 hover:to-rose-600 hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.7)] sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                                    >
                                        {t(
                                            'welcome.enter_dashboard',
                                            'Enter Dashboard',
                                        )}
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href="/login"
                                            className="w-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] transition-all duration-300 hover:-translate-y-1 hover:from-orange-600 hover:to-rose-600 hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.7)] sm:w-auto sm:px-8 sm:py-4 sm:text-base"
                                        >
                                            {t(
                                                'welcome.login_account',
                                                'Log in to your account',
                                            )}
                                        </Link>
                                        <a
                                            href="#contact"
                                            className="w-full rounded-full border border-black/10 bg-black/5 px-6 py-3 text-center text-sm font-medium text-slate-800 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-black/10 sm:w-auto sm:px-8 sm:py-4 sm:text-base dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                                        >
                                            {t(
                                                'welcome.btn_contact',
                                                "Bog'lanish",
                                            )}
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Hikvision Device Showcase */}
                        <div className="relative flex w-full flex-1 items-center justify-center lg:w-auto lg:justify-end">
                            {/* Glow */}
                            <div
                                className="absolute z-0 h-72 w-72 rounded-full blur-[40px] sm:h-88 sm:w-88 md:h-96 md:w-96"
                                style={{
                                    background:
                                        'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(249,115,22,0.15) 50%, transparent 70%)',
                                    animation:
                                        'showcaseGlow 4s ease-in-out infinite alternate',
                                }}
                            />
                            {/* Card */}
                            <div className="group relative z-10 flex cursor-default flex-col items-center gap-4 rounded-3xl border border-black/5 bg-white/50 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_35px_60px_-15px_rgba(99,102,241,0.15),0_0_40px_-10px_rgba(249,115,22,0.1)] sm:p-8 md:p-10 dark:border-white/10 dark:bg-white/5">
                                <img
                                    src="/image/hikvision.png"
                                    alt="Hikvision Face ID Terminal - Yuzni tanish qurilmasi"
                                    className="h-auto w-48 rounded-xl object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-transform duration-300 group-hover:scale-105 sm:w-60 md:w-72"
                                />
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <span className="inline-block rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 px-2.5 py-0.5 text-[0.65rem] font-bold tracking-wider text-white uppercase">
                                        Hikvision
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 sm:text-sm dark:text-slate-400">
                                        Face Recognition Terminal
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inline keyframes for glow animation */}
                    <style>{`
                        @keyframes showcaseGlow {
                            0% { transform: scale(0.9); opacity: 0.6; }
                            100% { transform: scale(1.15); opacity: 1; }
                        }
                    `}</style>

                    {/* SEO Semantic Content (visually balanced) */}
                    <div className="mt-12 grid w-full max-w-6xl grid-cols-1 gap-8 pb-20 text-left md:grid-cols-3">
                        <div className="rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                            <h2 className="mb-4 text-xl font-bold text-orange-500">
                                {t(
                                    'seo.feature_attendance_title',
                                    'Maktab Davomat Tizimi',
                                )}
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {t(
                                    'seo.feature_attendance_desc',
                                    "Maktabingiz uchun zamonaviy elektron davomat tizimi. Har bir o'quvchi harakati real vaqt rejimida qayd etiladi va hisobotlar avtomatik shakllanadi.",
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                            <h2 className="mb-4 text-xl font-bold text-rose-500">
                                {t(
                                    'seo.feature_turnstile_title',
                                    'Turniket va Face ID',
                                )}
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {t(
                                    'seo.feature_turnstile_desc',
                                    "Eng so'nggi Hikvision turniket tizimlari va yuzni tanish texnologiyasi. Bog'cha va maktab kirish joylarida xavfsizlikni eng yuqori darajaga olib chiqing.",
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                            <h2 className="mb-4 text-xl font-bold text-indigo-500">
                                {t(
                                    'seo.feature_notif_title',
                                    'Telegram Xabarnomalar',
                                )}
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                {t(
                                    'seo.feature_notif_desc',
                                    'Farzandingiz maktabga kelganida yoki ketganida darhol xabar oling. Ota-onalar xotirjamligi uchun Telegram bot orqali tezkor integratsiya.',
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Contact Section */}
                    <div id="contact" className="w-full max-w-6xl pb-20">
                        <div className="mb-10 text-center">
                            <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                                {t(
                                    'welcome.contact_title',
                                    "Biz bilan bog'laning",
                                )}
                            </h2>
                            <p className="mx-auto max-w-lg text-sm text-slate-500 sm:text-base dark:text-slate-400">
                                {t(
                                    'welcome.contact_desc',
                                    "Savollaringiz bormi? Biz bilan quyidagi usullar orqali bog'laning.",
                                )}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Telegram */}
                            <a
                                href="https://t.me/IslomFargniy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group cursor-pointer rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-lg hover:shadow-blue-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20 transition-transform duration-300 group-hover:scale-110">
                                    <Send className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                                    Telegram
                                </h3>
                                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                                    {t(
                                        'welcome.contact_telegram_desc',
                                        'Telegram orqali tez aloqa',
                                    )}
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-500 transition-colors group-hover:text-blue-400">
                                    <MessageCircle className="h-4 w-4" />
                                    @IslomFargniy
                                </span>
                            </a>

                            {/* Phone 1 */}
                            <a
                                href="tel:+998911157709"
                                className="group cursor-pointer rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-lg hover:shadow-orange-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 shadow-lg shadow-orange-500/20 transition-transform duration-300 group-hover:scale-110">
                                    <Phone className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                                    {t('welcome.contact_phone', 'Telefon')}
                                </h3>
                                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                                    {t(
                                        'welcome.contact_phone_desc',
                                        "Bizga qo'ng'iroq qiling",
                                    )}
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-500 transition-colors group-hover:text-orange-400">
                                    <Phone className="h-4 w-4" />
                                    +998 91 115 77 09
                                </span>
                            </a>

                            {/* Phone 2 */}
                            <a
                                href="tel:+998993033484"
                                className="group cursor-pointer rounded-2xl border border-black/5 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/80 hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:scale-110">
                                    <Phone className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">
                                    {t('welcome.contact_phone', 'Telefon')}
                                </h3>
                                <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
                                    {t(
                                        'welcome.contact_phone_desc2',
                                        "Qo'shimcha telefon raqam",
                                    )}
                                </p>
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 transition-colors group-hover:text-indigo-400">
                                    <Phone className="h-4 w-4" />
                                    +998 99 303 34 84
                                </span>
                            </a>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="z-10 w-full px-4 py-6 text-center text-xs font-light text-slate-500 sm:text-sm">
                    &copy; {year} SchoolDay Ecosystem.{' '}
                    {t('welcome.all_rights', 'All rights reserved.')}
                </footer>
            </div>
        </>
    );
}
