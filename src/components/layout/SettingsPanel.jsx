import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import BorderGlow from '../ui/BorderGlow.jsx';
import {
  LANGUAGES,
  SUPPORTED,
  applyLanguageAndReload,
  detectBrowserLanguage,
} from '../../i18n/index.js';
import './SettingsPanel.css';

const SUN_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MOON_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const CHECK_ICON = (
  <svg className="settings-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12.5 9.5 18 20 6.5" />
  </svg>
);

// Same open/close choreography as the header's variable dropdown.
const listVariants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.26, ease: [0.34, 1.1, 0.4, 1] },
      opacity: { duration: 0.18 },
      staggerChildren: 0.04, delayChildren: 0.06,
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.24, ease: [0.4, 0, 1, 1] },
      opacity: { duration: 0.18 },
      staggerChildren: 0.03, staggerDirection: -1,
    },
  },
};

const itemVariants = {
  open:   { opacity: 1, y: 0,  transition: { duration: 0.2, ease: [0.34, 1.1, 0.4, 1] } },
  closed: { opacity: 0, y: -6, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export default function SettingsPanel({ dark, onToggleTheme, onClose }) {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = i18n.resolvedLanguage || 'en';
  const browserLang = useMemo(detectBrowserLanguage, []);

  useEffect(() => {
    // Escape unwinds one layer at a time: the open dropdown first, then the panel.
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (langOpen) setLangOpen(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [langOpen, onClose]);

  // The theme lives in App as a single boolean, so a segment press is a no-op when it
  // already matches — no separate setter needed.
  const selectTheme = (wantDark) => { if (wantDark !== dark) onToggleTheme(); };

  const themes = [
    { key: 'light', icon: SUN_ICON,  label: t('settings.themeLight'), isDark: false },
    { key: 'dark',  icon: MOON_ICON, label: t('settings.themeDark'),  isDark: true  },
  ];

  // Same surface the chart panels use, so the card reads as one of them.
  const bg = dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)';

  return createPortal(
    <motion.div
      className="settings-backdrop"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="settings-shell"
        role="dialog"
        aria-modal="true"
        aria-label={t('settings.title')}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
      >
        <BorderGlow
          className="settings-card"
          backgroundColor={bg}
          borderRadius={22}
          glowRadius={5}
          glowIntensity={0.06}
          glowColor="225 42 30"
          edgeSensitivity={60}
          coneSpread={10}
          fillOpacity={0.01}
          colors={['#18203a', '#2b3a63', '#4a5a8a']}
        >
          <div className="fp-head">
            <div>
              <h2>{t('settings.title')}</h2>
            </div>
            <div className="fp-head-actions">
              <button className="close-x" onClick={onClose} aria-label={t('settings.close')}>✕</button>
            </div>
          </div>

          <div className="chart-title">
            <span className="dot" style={{ background: 'var(--text)' }} />
            {t('settings.theme')}
          </div>
          <div className="panel-metric-toggle settings-theme-toggle">
            {themes.map((theme) => (
              <button
                key={theme.key}
                className={`panel-metric-btn${theme.isDark === dark ? ' active' : ''}`}
                aria-pressed={theme.isDark === dark}
                onClick={() => selectTheme(theme.isDark)}
              >
                {theme.icon}
                <span>{theme.label}</span>
              </button>
            ))}
          </div>

          <div className="chart-title settings-heading">
            <span className="dot" style={{ background: 'var(--text)' }} />
            {t('settings.language')}
          </div>
          <div className="settings-select">
            <button
              className={`settings-select-trigger${langOpen ? ' open' : ''}`}
              aria-haspopup="true"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((v) => !v)}
            >
              <span className="settings-select-value" lang={currentLang}>
                {LANGUAGES[currentLang].name}
              </span>
              <motion.svg
                className="settings-chevron"
                width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"
                animate={{ rotate: langOpen ? 180 : 0 }}
                transition={{ duration: 0.26, ease: [0.34, 1.1, 0.4, 1] }}
              >
                <polyline points="6 9 12 15 18 9" />
              </motion.svg>
            </button>

            <AnimatePresence initial={false}>
              {langOpen && (
                <motion.div
                  className="settings-select-list"
                  initial="closed"
                  animate="open"
                  exit="closed"
                  variants={listVariants}
                >
                  <ul className="settings-select-list-inner">
                    {SUPPORTED.map((code) => {
                      const active = code === currentLang;
                      return (
                        <motion.li key={code} variants={itemVariants}>
                          <button
                            className={`settings-lang${active ? ' active' : ''}`}
                            lang={code}
                            aria-current={active ? 'true' : undefined}
                            aria-label={t('common.translateAria', { language: LANGUAGES[code].name })}
                            onClick={() => {
                              if (active) setLangOpen(false);
                              else applyLanguageAndReload(code);
                            }}
                          >
                            <span className="settings-lang-name">{LANGUAGES[code].name}</span>
                            {code === browserLang && !active && (
                              <span className="settings-lang-chip">{t('settings.detected')}</span>
                            )}
                            {active && CHECK_ICON}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </BorderGlow>
      </motion.div>
    </motion.div>,
    document.body
  );
}
