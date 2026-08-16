import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import it from './locales/it.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pt from './locales/pt.json';
import ptBR from './locales/pt-BR.json';

export const STORAGE_KEY = 'lp-lang';

// Native names are shown in the target language itself, so a visitor recognises
// the offer even while the interface is still in English.
export const LANGUAGES = {
  en:      { name: 'English',               invite: 'View in English'                  },
  it:      { name: 'Italiano',              invite: 'Traduci in italiano'              },
  es:      { name: 'Español',               invite: 'Traducir al español'              },
  fr:      { name: 'Français',              invite: 'Traduire en français'             },
  de:      { name: 'Deutsch',               invite: 'Auf Deutsch übersetzen'           },
  pt:      { name: 'Português (Portugal)',  invite: 'Traduzir para português'          },
  'pt-BR': { name: 'Português (Brasil)',    invite: 'Traduzir para português do Brasil'},
};

export const SUPPORTED = Object.keys(LANGUAGES);

const BY_TAG = Object.fromEntries(SUPPORTED.map((l) => [l.toLowerCase(), l]));

// First supported language the browser asks for, or English when there is no match.
// Region-qualified tags win over the bare language, so a pt-BR visitor gets the
// Brazilian catalogue rather than the European Portuguese one.
export function detectBrowserLanguage() {
  const wanted = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of wanted) {
    if (!tag) continue;
    const lower = tag.toLowerCase();
    if (BY_TAG[lower]) return BY_TAG[lower];
    const base = lower.split('-')[0];
    if (BY_TAG[base]) return BY_TAG[base];
  }
  return 'en';
}

// Persist the choice and reload: the app boots at the landing page, so the
// visitor lands back on the intro slides, now in their own language.
export function applyLanguageAndReload(lng) {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // Private mode / storage disabled — fall back to a live switch without reload.
    i18n.changeLanguage(lng);
    return;
  }
  window.location.reload();
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it },
      es: { translation: es },
      fr: { translation: fr },
      de: { translation: de },
      pt: { translation: pt },
      'pt-BR': { translation: ptBR },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED,
    // Keep pt-BR distinct instead of letting i18next fold it into pt.
    load: 'currentOnly',
    // The site stays in English until the visitor explicitly asks for their own
    // language, so only the stored choice is consulted here.
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
      caches: [],
    },
    interpolation: { escapeValue: false },
  });

const syncHtmlLang = (lng) => { document.documentElement.lang = lng || 'en'; };
syncHtmlLang(i18n.resolvedLanguage);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
