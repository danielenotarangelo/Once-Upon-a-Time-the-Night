import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import StarBorder from '../ui/StarBorder.jsx';

const menuListVariants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.28, ease: [0.34, 1.1, 0.4, 1] },
      opacity: { duration: 0.18 },
      staggerChildren: 0.06, delayChildren: 0.08,
    },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.32, ease: [0.4, 0, 1, 1] },
      opacity: { duration: 0.24 },
      staggerChildren: 0.05, staggerDirection: -1,
    },
  },
};

const menuItemVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.34, 1.1, 0.4, 1] },
  },
  closed: {
    opacity: 0,
    y: -8,
    scale: 0.7,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

const TOGGLE_ICONS = {
  r: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  g: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="15" width="4" height="6" />
      <rect x="10" y="10" width="4" height="11" />
      <rect x="16" y="4" width="4" height="17" />
    </svg>
  ),
  health: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
};

const NONE_SELECTED_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

function MenuIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <motion.line
        animate={open ? { x1: 5, y1: 5, x2: 19, y2: 19 } : { x1: 3, y1: 6, x2: 21, y2: 6 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.line
        animate={{ opacity: open ? 0 : 1 }}
        x1="3" y1="12" x2="21" y2="12"
        transition={{ duration: 0.2 }}
      />
      <motion.line
        animate={open ? { x1: 5, y1: 19, x2: 19, y2: 5 } : { x1: 3, y1: 18, x2: 21, y2: 18 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  );
}

const RANKINGS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="5" height="9" />
    <rect x="9.5" y="7" width="5" height="14" />
    <rect x="16" y="15" width="5" height="6" />
  </svg>
);

const RESULTS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function Header({ variable, onVariableChange, dark, onToggleTheme, onResultsClick, showResults, onOpenRankings }) {
  const toggles = [
    { key: 'r',      label: 'Light'  },
    { key: 'g',      label: 'Wealth' },
    { key: 'health', label: 'Health' },
  ];

  const [mobileOpen, setMobileOpen] = useState(false);
  const togglesRef = useRef(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (e) => {
      if (togglesRef.current && !togglesRef.current.contains(e.target)) setMobileOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [mobileOpen]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  return (
    <header>
      <div className="mobile-menu-wrap" ref={menuRef}>
        <button
          className="mobile-menu-btn"
          aria-label="Menu"
          onClick={() => setMenuOpen(v => !v)}
        >
          <MenuIcon open={menuOpen} />
        </button>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="mobile-menu-list"
              initial="closed"
              animate="open"
              exit="closed"
              variants={menuListVariants}
            >
              <div className="mobile-menu-list-inner">
                <motion.button
                  className="mobile-menu-fab-item"
                  variants={menuItemVariants}
                  onClick={() => { onOpenRankings?.(); setMenuOpen(false); }}
                >
                  {RANKINGS_ICON}
                  <span>Rankings</span>
                </motion.button>
                {showResults && (
                  <motion.button
                    className="mobile-menu-fab-item"
                    variants={menuItemVariants}
                    onClick={() => { onResultsClick(); setMenuOpen(false); }}
                  >
                    {RESULTS_ICON}
                    <span>Interesting Results</span>
                  </motion.button>
                )}
                <motion.button
                  className="mobile-menu-fab-item"
                  variants={menuItemVariants}
                  onClick={() => { onToggleTheme(); setMenuOpen(false); }}
                >
                  {dark ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                    </svg>
                  )}
                  <span>{dark ? 'Light mode' : 'Dark mode'}</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="brand">
        <h1>{'Once upon a time...\n the Night'}</h1>
        {showResults && (
          <StarBorder
            as="div"
            className="results-btn-fadein"
            color="#00e5ff"
            speed="4s"
            thickness={3}
            onClick={onResultsClick}
            style={{ borderRadius: 999, cursor: 'pointer' }}
          >
            <span style={{
              display: 'block',
              padding: '9px 20px',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'var(--text-dim)',
              whiteSpace: 'nowrap',
              background: 'var(--panel)',
              backdropFilter: 'blur(14px)',
              borderRadius: 999,
            }}>
              Interesting Results
            </span>
          </StarBorder>
        )}
      </div>
      <div className="head-right">
        {/* Desktop: plain always-visible pill row */}
        <div className="toggles">
          {toggles.map((t) => (
            <button
              key={t.key}
              className={`toggle${variable === t.key ? ' active' : ''}`}
              data-var={t.key}
              onClick={() => onVariableChange(variable === t.key ? null : t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Mobile: compact trigger + stretch-box dropdown, same style as the hamburger menu */}
        <div className="toggles-mobile-wrap" ref={togglesRef}>
          <button
            className={`toggle-trigger${variable ? ' active' : ''}`}
            data-var={variable || toggles[0].key}
            aria-label="Choose variable"
            onClick={() => setMobileOpen(v => !v)}
          >
            {variable ? TOGGLE_ICONS[variable] : NONE_SELECTED_ICON}
          </button>
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                className="toggles-dropdown"
                initial="closed"
                animate="open"
                exit="closed"
                variants={menuListVariants}
              >
                <div className="toggles-dropdown-inner">
                  {toggles.map((t) => (
                    <motion.button
                      key={t.key}
                      className={`toggle-item${variable === t.key ? ' active' : ''}`}
                      data-var={t.key}
                      variants={menuItemVariants}
                      onClick={() => {
                        onVariableChange(variable === t.key ? null : t.key);
                        setMobileOpen(false);
                      }}
                    >
                      {TOGGLE_ICONS[t.key]}
                      <span>{t.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button className="theme-btn" title="Toggle theme" onClick={onToggleTheme}>
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
