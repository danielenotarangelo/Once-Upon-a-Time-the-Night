import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LightGDPRatioChart from './LightGDPRatioChart.jsx';
import BorderGlow from '../ui/BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';
import { getSeries } from '../../lib/data.js';
import { YEARS } from '../../lib/constants.js';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

const fmtLGR = v => (v == null ? '—' : (v * 1e4).toFixed(2));

const fmtChange = (cur, first) => {
  if (cur == null || first == null || Math.abs(first) < 1e-12) return '—';
  const pct = (cur - first) / first * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
};

export default function LightGDPRatioPanel({ lookup, country, compareCountry, year, dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);
  const visible = inTab ? !!country : (inStack ? !!country : (!!country && open));
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const compareSeries = compareCountry ? getSeries(lookup, YEARS, compareCountry) : null;
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const compareCur = compareCountry && lookup[compareCountry] ? lookup[compareCountry][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const firstEntry    = series.find(d => d.lgr != null);
  const firstCmpEntry = compareSeries?.find(d => d.lgr != null);

  return (
    <BorderGlow
      className={inTab ? 'panel-tab-card' : (inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`)}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="330 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#ec4899', '#db2777', '#f472b6']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">{t('panels.ratio.label')}</div>
          <div className="fp-title-row">
            <h2>{t('panels.ratio.title')}</h2>
          </div>
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
          <div className="meta">×10⁻⁴ · {year}</div>
        </div>
        <div className="fp-head-actions">
          {country && <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomed(true); }} title={t('common.expandChart')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>}
          {onClose && <button className="close-x" onClick={onClose}>✕</button>}
        </div>
      </div>

      <p className="panel-desc">{t('panels.ratio.desc')}</p>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">{t('panels.ratio.stat')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtLGR(cur?.lgr)}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtLGR(compareCur?.lgr)}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: 'var(--lgr)' }}>{fmtLGR(cur?.lgr)}</div>
          )}
          <div className="unit">×10⁻⁴</div>
        </div>

        <div className="stat">
          <div className="label">{t('panels.ratio.since')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtChange(cur?.lgr, firstEntry?.lgr)}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtChange(compareCur?.lgr, firstCmpEntry?.lgr)}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: 'var(--lgr)' }}>{fmtChange(cur?.lgr, firstEntry?.lgr)}</div>
          )}
          <div className="unit">{t('panels.ratio.change')}</div>
        </div>
      </div>

      <div className="chart-title">
        {compareCountry ? t('panels.ratio.chartTitle') : (
          <><span className="dot" style={{ background: 'var(--lgr)' }} />{t('panels.ratio.chartTitle')}</>
        )}
      </div>

      {visible && <LightGDPRatioChart series={series} compareSeries={compareSeries} year={year} dark={dark} height={inStack ? null : (compact ? 150 : 200)} />}

      {zoomed && (
        <ChartModal title={t('panels.ratio.title')} subtitle={t('panels.ratio.label')} country={country} meta={`×10⁻⁴ · ${year}`} onClose={() => setZoomed(false)}>
          <LightGDPRatioChart series={series} compareSeries={compareSeries} year={year} dark={dark} height={480} />
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
