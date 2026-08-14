import { useState } from 'react';
import * as d3 from 'd3';
import QuadrantChart from './QuadrantChart.jsx';
import BorderGlow from '../ui/BorderGlow.jsx';
import ChartModal from './ChartModal.jsx';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function QuadrantPanel({ lookup, country, compareCountry, year, healthMetric = 'd', dark, open, onClose, inStack = false, inTab = false, bgColor, compact = false }) {
  const [zoomed, setZoomed] = useState(false);
  const [metric, setMetric] = useState(healthMetric);
  const [infoOpen, setInfoOpen] = useState(false);
  const visible = inTab ? true : (inStack ? !!country : (!!country && open));
  const cur        = country        && lookup[country]        ? lookup[country][year]        : null;
  const compareCur = compareCountry && lookup[compareCountry] ? lookup[compareCountry][year] : null;
  const bg = bgColor ?? (dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)');

  const metricShort = metric === 'd' ? 'Depressive' : 'Anxiety';

  const pts = [];
  for (const c in lookup) {
    const y = lookup[c][year];
    if (y && y.r != null && y[metric] != null) pts.push({ r: y.r, h: y[metric] });
  }
  const medR = d3.median(pts, d => d.r);
  const medH = d3.median(pts, d => d.h);

  const getQuadrant = (entry) => {
    if (entry?.r == null || entry?.[metric] == null || medR == null || medH == null) return null;
    if (entry.r == null) return null;
    const bright = entry.r > medR;
    const high   = entry[metric] > medH;
    if (bright && high)   return 'Bright · high disorders';
    if (bright && !high)  return 'Bright · low disorders';
    if (!bright && high)  return 'Dim · high disorders';
    return 'Dim · low disorders';
  };

  const quadrantA = getQuadrant(cur);
  const quadrantB = compareCountry ? getQuadrant(compareCur) : null;

  return (
    <BorderGlow
      className={inTab ? 'panel-tab-card' : (inStack ? 'panel-stack-card' : `float-panel right${visible ? ' visible' : ''}`)}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="270 80 65"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={['#7c3aed', '#6d28d9', '#a78bfa']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">All countries · {year}</div>
          <div className="fp-title-row">
            <h2>Radiance &amp; Health Quadrants</h2>
            <span
              className={`info-btn${infoOpen ? ' open' : ''}`}
              tabIndex={0}
              role="button"
              aria-label="More information"
              onClick={(e) => { e.stopPropagation(); setInfoOpen(v => !v); }}
              onBlur={() => setInfoOpen(false)}
            >i
              <span className="info-tooltip">
                The mental health data represents the prevalence of depressive and anxiety disorders, not sleep disorders specifically. Given the indirect nature of the relationship with light pollution, these results should be interpreted with caution.
              </span>
            </span>
          </div>
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
        </div>
        <div className="fp-head-actions">
          {country && <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomed(true); }} title="Expand chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>}
          {onClose && <button className="close-x" onClick={onClose}>✕</button>}
        </div>
      </div>

      <p className="panel-desc">
        Each dot is a country, positioned by its radiance (x-axis) and mental health disorder prevalence (y-axis). The axes cross at the global median, dividing countries into four groups based on whether they are above or below average on each dimension.
      </p>

      <div className="panel-metric-toggle">
        <button className={`panel-metric-btn${metric === 'd' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setMetric('d'); }}>Depressive</button>
        <button className={`panel-metric-btn${metric === 'a' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setMetric('a'); }}>Anxiety</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 12, gap: 7 }}>
        <div className="stat" style={{ padding: '7px 10px' }}>
          <div className="label">Radiance</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {cur?.r != null ? d3.format('.2f')(cur.r) : '—'}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {compareCur?.r != null ? d3.format('.2f')(compareCur.r) : '—'}
              </div>
            </div>
          ) : (
            <div className="value" style={{ fontSize: 18 }}>{cur?.r != null ? d3.format('.2f')(cur.r) : '—'}</div>
          )}
          <div className="unit">nW/cm²/sr</div>
        </div>

        <div className="stat" style={{ padding: '7px 10px' }}>
          <div className="label">{metricShort}</div>
          {compareCountry ? (
            <div className="cmp-stat-pair">
              <div className="cmp-stat-row" style={{ color: COLOR_A }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_A }} />
                {cur?.[metric] != null ? d3.format(',.0f')(cur[metric]) : '—'}
              </div>
              <div className="cmp-stat-row" style={{ color: COLOR_B }}>
                <span className="cmp-stat-dot" style={{ background: COLOR_B }} />
                {compareCur?.[metric] != null ? d3.format(',.0f')(compareCur[metric]) : '—'}
              </div>
            </div>
          ) : (
            <div className="value" style={{ color: 'var(--health)', fontSize: 18 }}>
              {cur?.[metric] != null ? d3.format(',.0f')(cur[metric]) : '—'}
            </div>
          )}
          <div className="unit">/100k</div>
        </div>
      </div>

      {visible && (
        <QuadrantChart
          lookup={lookup}
          year={year}
          selected={country}
          compareCountry={compareCountry}
          healthMetric={metric}
          dark={dark}
          height={inStack ? null : (compact ? 150 : 360)}
        />
      )}
      {zoomed && (
        <ChartModal title="Radiance & Health Quadrants" subtitle={`All countries · ${year}`} country={country} onClose={() => setZoomed(false)}>
          <div className="panel-metric-toggle" style={{ marginBottom: 12 }}>
            <button className={`panel-metric-btn${metric === 'd' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setMetric('d'); }}>Depressive</button>
            <button className={`panel-metric-btn${metric === 'a' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setMetric('a'); }}>Anxiety</button>
          </div>
          <QuadrantChart lookup={lookup} year={year} selected={country} compareCountry={compareCountry} healthMetric={metric} dark={dark} height={560} />
        </ChartModal>
      )}
    </BorderGlow>
  );
}
