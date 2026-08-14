import { useEffect, useRef, useState } from 'react';
import StarBorder from '../ui/StarBorder.jsx';

export default function Header({ variable, onVariableChange, dark, onToggleTheme, onResultsClick, showResults }) {
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

  return (
    <header>
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
        <div
          className={`toggles${mobileOpen ? ' open' : ''}`}
          ref={togglesRef}
          onClick={() => {
            if (window.innerWidth <= 640 && !mobileOpen) setMobileOpen(true);
          }}
        >
          {toggles.map((t, i) => (
            <button
              key={t.key}
              className={`toggle${variable === t.key ? ' active' : ''}${!variable && i === 0 ? ' mobile-default' : ''}`}
              data-var={t.key}
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth <= 640 && !mobileOpen) {
                  setMobileOpen(true);
                  return;
                }
                onVariableChange(variable === t.key ? null : t.key);
                setMobileOpen(false);
              }}
            >
              {t.label}
            </button>
          ))}
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
