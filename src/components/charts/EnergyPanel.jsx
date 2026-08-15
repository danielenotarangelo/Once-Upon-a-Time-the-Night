import { useState } from 'react';
import * as d3 from 'd3';
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
          <div className="fp-label">Contextual factors</div>
          <h2>Energy Use &amp; Urbanization</h2>
          {country && !compareCountry && <div className="fp-country">{country}</div>}
          {country && compareCountry && (
            <div className="fp-compare-countries">
              <span className="fp-compare-country" style={{ fontSize: 14 }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />{country}
              </span>
              <span className="fp-vs">vs</span>
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

      <p className="panel-desc">
        Energy consumption and urbanization are two of the main drivers of artificial light at night. Countries that use more electricity and have a larger share of urban population tend to produce significantly more light pollution.
      </p>

      <div className="stat-grid" style={{ marginBottom: 12, gap: 7 }}>
        <div className="stat" style={{ padding: '7px 10px' }}>
          <div className="label">Energy use</div>
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
          <div className="unit">per capita</div>
        </div>
        <div className="stat" style={{ padding: '7px 10px' }}>
          <div className="label">Urban pop.</div>
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
          <div className="unit">% of total</div>
        </div>
      </div>

      {/* Energy chart */}
      <div className="chart-title">
        {compareCountry
          ? 'Electric power consumption (kWh/capita)'
          : <><span className="dot" style={{ background: '#10b981' }} />Electric power consumption (kWh/capita)</>
        }
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedEnergy(true); }} title="Expand chart">
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
          ? 'Urban population (% of total)'
          : <><span className="dot" style={{ background: '#06b6d4' }} />Urban population (% of total)</>
        }
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedUrban(true); }} title="Expand chart">
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
        <ChartModal title="Energy Use" subtitle="Electric power consumption (kWh per capita)" country={country} meta={String(year)} onClose={() => setZoomedEnergy(false)}>
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
        <ChartModal title="Urbanization Rate" subtitle="Urban population as % of total" country={country} meta={String(year)} onClose={() => setZoomedUrban(false)}>
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
