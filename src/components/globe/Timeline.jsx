import { useEffect, useRef } from 'react';
import { YEARS, YEAR_CAPTIONS } from '../../lib/constants.js';
import ElasticSlider from '../ui/ElasticSlider.jsx';

export default function Timeline({ year, onYearChange, playing, onTogglePlay }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        onYearChange((prev) => {
          const next = prev + 1;
          return next > YEARS[YEARS.length - 1] ? YEARS[0] : next;
        });
      }, 1100);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, onYearChange]);

  const min = YEARS[0];
  const max = YEARS[YEARS.length - 1];

  return (
    <div className="timeline">
      <div className="tl-head">
        <div className="year-display">{year}</div>
        <div className="year-caption">{YEAR_CAPTIONS[year] || ''}</div>
      </div>
      <div className="tl-controls">
        <button className="play-btn" onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1" y="1" width="4" height="12" rx="1" />
              <rect x="9" y="1" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <polygon points="2,1 13,7 2,13" />
            </svg>
          )}
        </button>
        <div className="es-track-area">
          <ElasticSlider
            startingValue={min}
            defaultValue={year}
            maxValue={max}
            isStepped
            stepSize={1}
            onChange={onYearChange}
            leftIcon={null}
            rightIcon={null}
          />
          <div className="ticks">
            {YEARS.map((y) => (
              <div
                key={y}
                className={`tick${y <= year ? ' passed' : ''}${y === year ? ' current' : ''}`}
                data-year={y}
                onClick={() => onYearChange(y)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
