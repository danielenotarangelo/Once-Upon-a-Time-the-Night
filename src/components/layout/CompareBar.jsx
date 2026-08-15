import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getFlagEmoji } from '../../utils/countryFlags.js';

const ANIM_MS = 180;
const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function CompareBar({
  selected,
  compareCountry,
  compareMode,
  countries,
  onClose,
  onCloseSelected,
  onEnterCompare,
  onCancelCompare,
  onSelectCompare,
  onClearCompare,
  compact = false,
}) {
  const [query,       setQuery]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const inputRef   = useRef(null);
  const wrapperRef = useRef(null);

  const targetState = compareMode ? 'picker' : compareCountry ? 'result' : 'trigger';
  const [displayState, setDisplayState] = useState(targetState);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (targetState === displayState) return;
    setExiting(true);
    const t = setTimeout(() => {
      setDisplayState(targetState);
      setExiting(false);
    }, ANIM_MS);
    return () => clearTimeout(t);
  }, [targetState]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!compareMode) {
      setQuery(''); setSuggestions([]); setActiveIdx(-1);
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), ANIM_MS + 10);
    return () => clearTimeout(t);
  }, [compareMode]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setActiveIdx(-1);
    if (!q.trim()) { setSuggestions([]); return; }
    const lower    = q.toLowerCase();
    const pool     = countries.filter(c => c !== selected);
    const starts   = pool.filter(c => c.toLowerCase().startsWith(lower));
    const contains = pool.filter(c => !c.toLowerCase().startsWith(lower) && c.toLowerCase().includes(lower));
    setSuggestions([...starts, ...contains].slice(0, 6));
  };

  const commit = (name) => {
    setQuery('');
    setSuggestions([]);
    onSelectCompare(name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown')  { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { const t = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0]; if (t) commit(t); }
    else if (e.key === 'Escape') { onCancelCompare(); }
  };

  const flag1 = getFlagEmoji(selected);
  const flag2 = compareCountry ? getFlagEmoji(compareCountry) : null;
  const animClass = exiting ? ' exiting' : '';

  // ── Compact mode: docked footer bar, no redundant top badge ───────
  if (compact) {
    if (displayState === 'result') {
      return (
        <div className={`compare-bar-mobile-dual${animClass}`}>
          <span className="compare-badge-dot" style={{ background: COLOR_A }} />
          <span className="compare-bar-mobile-name">{flag1 && `${flag1} `}{selected}</span>
          <span className="compare-vs-separator">vs</span>
          <span className="compare-badge-dot" style={{ background: COLOR_B }} />
          <span className="compare-bar-mobile-name">{flag2 && `${flag2} `}{compareCountry}</span>
          <button className="close-x" onClick={onClearCompare}>✕</button>
        </div>
      );
    }
    if (displayState === 'picker') {
      return createPortal(
        <div className={`compare-picker-backdrop${animClass}`} onClick={onCancelCompare}>
          <div className={`compare-picker-card compare-picker-card-center${animClass}`} ref={wrapperRef} onClick={e => e.stopPropagation()}>
            <div className="compare-search-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
                <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
              </svg>
              <input
                ref={inputRef}
                className="compare-search-input"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Search a country…"
                autoComplete="off"
                spellCheck={false}
              />
              <button className="close-x" tabIndex={-1} onClick={onCancelCompare} style={{ flexShrink: 0 }}>✕</button>
            </div>
            {suggestions.length > 0 && (
              <ul className="compare-suggestions">
                {suggestions.map((s, i) => {
                  const f = getFlagEmoji(s);
                  return (
                    <li key={s} className={i === activeIdx ? 'active' : ''} onMouseDown={() => commit(s)}>
                      {f && <span className="suggestion-flag">{f}</span>}
                      {s}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="compare-hint">or click a country on the globe</div>
          </div>
        </div>,
        document.body
      );
    }
    return (
      <div className="compare-bar-mobile">
        {displayState === 'trigger' && (
          <button className={`compare-trigger-btn compare-trigger-btn-mobile${animClass}`} onClick={onEnterCompare}>
            Compare with…
          </button>
        )}
      </div>
    );
  }

  // ── Dual badge: both countries selected ──────────────────────────
  if (displayState === 'result') {
    return (
      <div className={`compare-bar-dual${animClass ? ' exiting' : ''}`}>
        <div className="country-badge-center">
          <span className="compare-badge-dot" style={{ background: COLOR_A }} />
          <div className="country-badge-center-info">
            <span className="country-badge-center-name">
              {flag1 && <span style={{ marginRight: 6 }}>{flag1}</span>}
              {selected}
            </span>
          </div>
          <button className="close-x" onClick={onCloseSelected}>✕</button>
        </div>

        <span className="compare-vs-separator">vs</span>

        <div className="country-badge-center">
          <span className="compare-badge-dot" style={{ background: COLOR_B }} />
          <div className="country-badge-center-info">
            <span className="country-badge-center-name">
              {flag2 && <span style={{ marginRight: 6 }}>{flag2}</span>}
              {compareCountry}
            </span>
          </div>
          <button className="close-x" onClick={onClearCompare}>✕</button>
        </div>
      </div>
    );
  }

  // ── Single badge + trigger / picker ──────────────────────────────
  return (
    <div className="compare-bar-stack">
      <div className="country-badge-center">
        <div className="country-badge-center-info">
          <span className="country-badge-center-label">Selected territory</span>
          <span className="country-badge-center-name">
            {flag1 && <span style={{ marginRight: 6 }}>{flag1}</span>}
            {selected}
          </span>
        </div>
        <button className="close-x" onClick={onClose}>✕</button>
      </div>

      {displayState === 'trigger' && (
        <button className={`compare-trigger-btn${animClass}`} onClick={onEnterCompare}>
          Compare with…
        </button>
      )}

      {displayState === 'picker' && (
        <div className={`compare-picker-card${animClass}`} ref={wrapperRef}>
          <div className="compare-search-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.5 }}>
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
            <input
              ref={inputRef}
              className="compare-search-input"
              value={query}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Search a country…"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="close-x" tabIndex={-1} onClick={onCancelCompare} style={{ flexShrink: 0 }}>✕</button>
          </div>

          {suggestions.length > 0 && (
            <ul className="compare-suggestions">
              {suggestions.map((s, i) => {
                const f = getFlagEmoji(s);
                return (
                  <li key={s} className={i === activeIdx ? 'active' : ''} onMouseDown={() => commit(s)}>
                    {f && <span className="suggestion-flag">{f}</span>}
                    {s}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="compare-hint">or click a country on the globe</div>
        </div>
      )}
    </div>
  );
}
