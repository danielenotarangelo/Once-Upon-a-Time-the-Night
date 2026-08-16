import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RadianceGrowthChart from './RadianceGrowthChart.jsx';
import BorderGlow from '../ui/BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';
import { getSeries } from '../../lib/data.js';
import { YEARS } from '../../lib/constants.js';
import { getFlagEmoji } from '../../utils/countryFlags.js';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

const fmtLGI = v => {
  if (v == null || Math.abs(v) < 1e-8) return '—';
  const pct = v * 100;
  const digits = Math.abs(pct) >= 1 ? 0 : 1;
  return (v >= 0 ? '+' : '') + pct.toFixed(digits) + '%';
};

const avgOf = (arr, key) => {
  const vals = arr.filter(d => d[key] != null && Math.abs(d[key]) > 1e-8);
  return vals.length ? vals.reduce((s, d) => s + d[key], 0) / vals.length : null;
};

export default function RadianceGrowthPanel({ lookup, country, compareCountry, year, dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);
  const visible = inTab ? !!country : (inStack ? !!country : (!!country && open));

  const series     = country        ? getSeries(lookup, YEARS, country)        : [];
  const cmpSeries  = compareCountry ? getSeries(lookup, YEARS, compareCountry) : null;

  const cur        = country        && lookup[country]        ? lookup[country][year]        : null;
  const cmpCur     = compareCountry && lookup[compareCountry] ? lookup[compareCountry][year] : null;
  const bg         = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const curLGI    = cur?.lgi    ?? null;
  const cmpLGI    = cmpCur?.lgi ?? null;
  const avgLGI    = avgOf(series, 'lgi');
  const cmpAvgLGI = cmpSeries ? avgOf(cmpSeries, 'lgi') : null;

  const lgiColor = v => v != null && v >= 0 ? 'var(--lgi)' : 'var(--lgr)';
  const flag1 = getFlagEmoji(country);
  const flag2 = compareCountry ? getFlagEmoji(compareCountry) : null;

  return (
    <BorderGlow
      className={inTab ? 'panel-tab-card' : (inStack ? 'panel-stack-card' : `float-panel left${visible ? ' visible' : ''}`)}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="220 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#3b82f6', '#2563eb', '#60a5fa']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">{t('panels.growth.label')}</div>
          <h2>{t('panels.growth.title')}</h2>

          {country && !compareCountry && <div className="fp-country">{country}</div>}
          {country && compareCountry && (
            <div className="fp-compare-countries">
              <span className="fp-compare-country" style={{ fontSize: 14 }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />{country}
              </span>
              <span className="fp-vs">{t('common.vs')}</span>
              <span className="fp-compare-country" style={{ fontSize: 14 }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />{compareCountry}
              </span>
            </div>
          )}

          <div className="meta">{year}</div>
        </div>
        <div className="fp-head-actions">
          {country && <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomed(true); }} title={t('common.expandChart')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>}
          {onClose && <button className="close-x" onClick={onClose}>✕</button>}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">{t('panels.growth.thisYear')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtLGI(curLGI)}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtLGI(cmpLGI)}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: lgiColor(curLGI) }}>{fmtLGI(curLGI)}</div>
          )}
          <div className="unit">{t('panels.growth.change')}</div>
        </div>

        <div className="stat">
          <div className="label">{t('panels.growth.avgGrowth')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtLGI(avgLGI)}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtLGI(cmpAvgLGI)}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: lgiColor(avgLGI) }}>{fmtLGI(avgLGI)}</div>
          )}
          <div className="unit">{t('panels.growth.perYear')}</div>
        </div>
      </div>

      <div className="chart-title">
        {compareCountry ? t('panels.growth.chartTitle') : (
          <><span className="dot" style={{ background: 'var(--lgi)' }} />{t('panels.growth.chartTitle')}</>
        )}
      </div>

      {visible && <RadianceGrowthChart series={series} compareSeries={cmpSeries} year={year} dark={dark} height={inStack ? null : (compact ? 150 : 200)} />}

      {zoomed && (
        <ChartModal title={t('panels.growth.title')} subtitle={t('panels.growth.label')} country={country} meta={String(year)} onClose={() => setZoomed(false)}>
          <RadianceGrowthChart series={series} compareSeries={cmpSeries} year={year} dark={dark} height={480} />
          {compareCountry && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />{country}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />{compareCountry}
              </span>
            </div>
          )}
        </ChartModal>
      )}
    </BorderGlow>
  );
}
