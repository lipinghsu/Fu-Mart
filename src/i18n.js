import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      // Translation file path: e.g., assets/i18n/home/en.json
      loadPath: 'assets/i18n/{{ns}}/{{lng}}.json',
    },
    fallbackLng: 'en',
    debug: true,

    // All namespaces you are using
    ns: [
      'common',
      'home',
      'account',
      'footer',
      'productCard',
      'about',
      'privacy',
      'terms',
      'comingsoon',
      'storefront',
    ],
    defaultNS: 'common', // set a default, typically 'common' or 'home'

    interpolation: {
      escapeValue: false, // React already escapes by default
      formatSeparator: ',',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
