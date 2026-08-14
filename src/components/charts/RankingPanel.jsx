import { useState, useEffect } from 'react';
import BorderGlow from '../ui/BorderGlow.jsx';
import RankingChart, { RANK_METRICS } from './RankingChart.jsx';
import ChartModal from './ChartModal.jsx';

export default function RankingPanel({ lookup, year, dark, visible, onSelect, mobileMode = false, onClose }) {
  const [metric,   setMetric]   = useState('r');
  const [expanded, setExpanded] = useState(false);

  // On mobile there's no room for the compact side panel — jump straight to the full-screen modal.
  useEffect(() => {
    if (mobileMode && visible) setExpanded(true);
  }, [mobileMode, visible]);

  const closeExpanded = () => {
    setExpanded(false);
    if (mobileMode) onClose?.();
  };

  const curMeta = RANK_METRICS.find(m => m.key === metric);
  const bg = dark ? 'rgba(13, 16, 28, 0.92)' : 'rgba(248, 249, 252, 0.95)';

  return (
    <>
      <div className={`global-ranking-panel${visible ? ' visible' : ''}`}>
        <BorderGlow
          className="global-ranking-inner"
          backgroundColor={bg}
          borderRadius={22}
          glowRadius={6}
          glowIntensity={0.07}
          glowColor="59 130 246"
          edgeSensitivity={80}
          coneSpread={12}
          fillOpacity={0.01}
          colors={['#3b82f6', '#2563eb', '#60a5fa']}
        >
          <div className="grp-head">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="fp-label">Global overview · {year}</div>
                <h2>Top 10 Countries</h2>
              </div>
              <button
                className="zoom-btn"
                onClick={e => { e.stopPropagation(); setExpanded(true); }}
                title="Expand ranking"
                style={{ marginTop: 4 }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
              </button>
            </div>
          </div>

          <p className="grp-hint">Click any country on the globe to explore its data</p>

          <div className="ranking-tabs">
            {RANK_METRICS.map(m => (
              <button
                key={m.key}
                className={`ranking-tab${metric === m.key ? ' active' : ''}`}
                onClick={() => setMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grp-unit">{curMeta?.unit}</div>

          <div className="grp-chart-wrap">
            <RankingChart
              lookup={lookup}
              year={year}
              dark={dark}
              country={null}
              metric={metric}
              onSelect={onSelect}
              topN={10}
            />
          </div>
        </BorderGlow>
      </div>

      {expanded && (
        <ChartModal
          title="Full Global Ranking"
          subtitle={curMeta?.unit}
          meta={String(year)}
          onClose={closeExpanded}
        >
          <div className="ranking-tabs" style={{ marginBottom: 14 }}>
            {RANK_METRICS.map(m => (
              <button
                key={m.key}
                className={`ranking-tab${metric === m.key ? ' active' : ''}`}
                onClick={() => setMetric(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <RankingChart
            lookup={lookup}
            year={year}
            dark={dark}
            country={null}
            metric={metric}
            onSelect={onSelect}
            topN={null}
          />
        </ChartModal>
      )}
    </>
  );
}
