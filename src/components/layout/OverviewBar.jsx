import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getFlagEmoji } from '../../utils/countryFlags.js';

export default function OverviewBar({ countries, onSelect, showRanking, onToggleRanking }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setActiveIdx(-1);
    if (!q.trim()) { setSuggestions([]); return; }
    const lower = q.toLowerCase();
    const starts = countries.filter(c => c.toLowerCase().startsWith(lower));
    const contains = countries.filter(
      c => !c.toLowerCase().startsWith(lower) && c.toLowerCase().includes(lower)
    );
    setSuggestions([...starts, ...contains].slice(0, 8));
  };

  const commit = (name) => {
    setQuery('');
    setSuggestions([]);
    onSelect(name);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const target = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
      if (target) commit(target);
    } else if (e.key === 'Escape') {
      setQuery('');
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <motion.div
      className="overview-bar"
      style={{ x: '-50%' }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="overview-search-wrap" ref={wrapperRef}>
        <div className="search-bar-row">
          <svg className="search-bar-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
          <input
            ref={inputRef}
            className="search-bar-input"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('common.searchCountry')}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className="search-bar-clear"
              onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
              tabIndex={-1}
            >
              ✕
            </button>
          )}
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.ul
              className="search-bar-suggestions"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            >
              {suggestions.map((s, i) => {
                const flag = getFlagEmoji(s);
                return (
                  <li
                    key={s}
                    className={`search-bar-suggestion${i === activeIdx ? ' active' : ''}`}
                    onMouseDown={() => commit(s)}
                  >
                    {flag && <span className="suggestion-flag">{flag}</span>}
                    {s}
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      <div className="overview-tabs">
        <button
          className={`overview-tab${!showRanking ? ' active' : ''}`}
          onClick={() => showRanking && onToggleRanking()}
        >
          {t('overview.explore')}
        </button>
        <button
          className={`overview-tab${showRanking ? ' active' : ''}`}
          onClick={() => !showRanking && onToggleRanking()}
        >
          {t('overview.rankings')}
        </button>
      </div>
    </motion.div>
  );
}
