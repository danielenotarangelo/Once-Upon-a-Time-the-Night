import { useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import BorderGlow from '../ui/BorderGlow.jsx';
import MetricChart from './MetricChart.jsx';
import ChartModal from './ChartModal.jsx';
import { getSeries } from '../../lib/data.js';
import { YEARS } from '../../lib/constants.js';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

const fmtEnergy = v => v == null ? '—' : d3.format(',.0f')(v) + ' kWh';
const fmtUrban  = v => v == null ? '—' : d3.format('.1f')(v) + '%';

export default function EnergyPanel({ lookup, country, compareCountry, year, dark, onClose, inStack = false, bgColor }) {
  const { t } = useTranslation();
  const [zoomedEnergy, setZoomedEnergy] = useState(false);
  const [zoomedUrban,  setZoomedUrban]  = useState(false);

  const series        = country        ? getSeries(lookup, YEARS, country)        : [];
  const compareSeries = compareCountry ? getSeries(lookup, YEARS, compareCountry) : null;
  const cur           = country        && lookup[country]        ? lookup[country][year]        : null;
  const compareCur    = compareCountry && lookup[compareCountry] ? lookup[compareCountry][year] : null;
  const bg            = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : 'float-panel visible'}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="16 185 129"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#10b981', '#06b6d4', '#3b82f6']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">{t('panels.energy.label')}</div>
          <h2>{t('panels.energy.title')}</h2>
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
        {onClose && (
          <div className="fp-head-actions">
            <button className="close-x" onClick={onClose}>✕</button>
          </div>
        )}
      </div>

      <p className="panel-desc">{t('panels.energy.desc')}</p>

      <div className="stat-grid" style={{ marginBottom: 12, gap: 7 }}>
        <div className="stat" style={{ padding: '7px 10px' }}>
          <div className="label">{t('panels.energy.energyUse')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtEnergy(cur?.e)}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtEnergy(compareCur?.e)}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: '#10b981', fontSize: 18 }}>{fmtEnergy(cur?.e)}</div>
          )}
          <div className="unit">{t('panels.energy.perCapita')}</div>
        </div>
        <div className="stat" style={{ padding: '7px 10px' }}>
          <div className="label">{t('panels.energy.urbanPop')}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {fmtUrban(cur?.u)}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {fmtUrban(compareCur?.u)}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: '#06b6d4', fontSize: 18 }}>{fmtUrban(cur?.u)}</div>
          )}
          <div className="unit">{t('panels.energy.ofTotal')}</div>
        </div>
      </div>

      {/* Energy chart */}
      <div className="chart-title">
        {compareCountry
          ? t('panels.energy.energyChart')
          : <><span className="dot" style={{ background: '#10b981' }} />{t('panels.energy.energyChart')}</>
        }
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedEnergy(true); }} title={t('common.expandChart')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        )}
      </div>
      {country && (
        <MetricChart
          series={series}
          compareSeries={compareSeries}
          metricKey="e"
          year={year}
          color="#10b981"
          dark={dark}
          height={inStack ? null : 130}
          fmt={v => d3.format(',.0f')(v)}
        />
      )}

      {/* Urbanization chart */}
      <div className="chart-title" style={{ marginTop: 10 }}>
        {compareCountry
          ? t('panels.energy.urbanChart')
          : <><span className="dot" style={{ background: '#06b6d4' }} />{t('panels.energy.urbanChart')}</>
        }
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedUrban(true); }} title={t('common.expandChart')}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        )}
      </div>
      {country && (
        <MetricChart
          series={series}
          compareSeries={compareSeries}
          metricKey="u"
          year={year}
          color="#06b6d4"
          dark={dark}
          height={inStack ? null : 130}
          fmt={v => d3.format('.1f')(v) + '%'}
        />
      )}

      {zoomedEnergy && (
        <ChartModal title={t('panels.energy.energyModalTitle')} subtitle={t('panels.energy.energyModalSubtitle')} country={country} meta={String(year)} onClose={() => setZoomedEnergy(false)}>
          <MetricChart series={series} compareSeries={compareSeries} metricKey="e" year={year} color="#10b981" dark={dark} height={440} fmt={v => d3.format(',.0f')(v)} />
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
      {zoomedUrban && (
        <ChartModal title={t('panels.energy.urbanModalTitle')} subtitle={t('panels.energy.urbanModalSubtitle')} country={country} meta={String(year)} onClose={() => setZoomedUrban(false)}>
          <MetricChart series={series} compareSeries={compareSeries} metricKey="u" year={year} color="#06b6d4" dark={dark} height={440} fmt={v => d3.format('.1f')(v) + '%'} />
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
