import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'uz',
        supportedLngs: ['uz', 'ru', 'en'],
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json?v=1.4',
        },
        detection: {
            order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
            caches: ['cookie', 'localStorage'],
        },
        debug: false,
    });

export default i18n;
