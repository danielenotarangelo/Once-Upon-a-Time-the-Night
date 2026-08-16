import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RadianceGDPChart from './RadianceGDPChart.jsx';
import BorderGlow from '../ui/BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';
import { fmt, getSeries } from '../../lib/data.js';
import { YEARS } from '../../lib/constants.js';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function RadianceGDPPanel({ lookup, country, compareCountry, year, dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const { t } = useTranslation();
  const [zoomed, setZoomed] = useState(false);
  const visible = inTab ? !!country : (inStack ? !!country : (!!country && open));
  const series = country ? getSeries(lookup, YEARS, country) : [];
  const compareSeries = compareCountry ? getSeries(lookup, YEARS, compareCountry) : null;
  const cur = country && lookup[country] ? lookup[country][year] : null;
  const compareCur = compareCountry && lookup[compareCountry] ? lookup[compareCountry][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  return (
    <BorderGlow
      className={inTab ? 'panel-tab-card' : (inStack ? 'panel-stack-card' : `float-panel left${visible ? ' visible' : ''}`)}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="35 90 70"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#ffb454', '#e8841a', '#5ad1a0']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">{t('panels.radianceGdp.label')}</div>
          <h2>{t('panels.radianceGdp.title')}</h2>
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
          <div className="label">{t('panels.radianceGdp.radiance')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {cur ? fmt(cur.r, 'r') : '—'}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {compareCur ? fmt(compareCur.r, 'r') : '—'}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: 'var(--radiance)' }}>{cur ? fmt(cur.r, 'r') : '—'}</div>
          )}
          <div className="unit">nW/cm²/sr</div>
        </div>
        <div className="stat">
          <div className="label">{t('panels.radianceGdp.gdp')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {cur ? fmt(cur.g, 'g') : '—'}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {compareCur ? fmt(compareCur.g, 'g') : '—'}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: 'var(--gdp)' }}>{cur ? fmt(cur.g, 'g') : '—'}</div>
          )}
          <div className="unit">USD</div>
        </div>
      </div>
      <div className="chart-title">
        {compareCountry ? t('panels.radianceGdp.chartTitleCompare') : (
          <><span className="dot" style={{ background: 'var(--radiance)' }} />{t('panels.radianceGdp.light')} <span className="dot" style={{ background: 'var(--gdp)' }} />{t('panels.radianceGdp.wealth')}</>
        )}
      </div>
      {visible && <RadianceGDPChart series={series} compareSeries={compareSeries} year={year} dark={dark} height={inStack ? null : (compact ? 150 : 240)} />}
      {zoomed && (
        <ChartModal title={t('panels.radianceGdp.title')} subtitle={t('panels.radianceGdp.label')} country={country} meta={String(year)} onClose={() => setZoomed(false)}>
          <RadianceGDPChart series={series} compareSeries={compareSeries} year={year} dark={dark} height={500} />
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
