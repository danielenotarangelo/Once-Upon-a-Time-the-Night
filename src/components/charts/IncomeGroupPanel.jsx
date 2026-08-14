import { useState, useMemo } from 'react';
import * as d3 from 'd3';
import BorderGlow from '../ui/BorderGlow.jsx';
import IncomeGroupChart from './IncomeGroupChart.jsx';
import ChartModal from './ChartModal.jsx';

function computePoints(lookup, year, metric) {
  const entries = Object.entries(lookup)
    .map(([name, ts]) => ({ name, g: ts[year]?.g, v: ts[year]?.[metric] }))
    .filter(e => e.g != null && e.v != null);

  if (entries.length < 4) return [];

  const gdpSorted = entries.map(e => e.g).sort(d3.ascending);
  const q1 = d3.quantile(gdpSorted, 0.25);
  const q2 = d3.quantile(gdpSorted, 0.50);
  const q3 = d3.quantile(gdpSorted, 0.75);

  return entries.map(e => ({
    name:  e.name,
    tier:  e.g <= q1 ? 0 : e.g <= q2 ? 1 : e.g <= q3 ? 2 : 3,
    value: e.v,
  }));
}

const R_COLOR = '#f97316';
const H_COLOR = '#a855f7';
const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function IncomeGroupPanel({ lookup, country, compareCountry, year, dark, healthMetric = 'd', inStack = false }) {
  const [zoomedR, setZoomedR] = useState(false);
  const [zoomedH, setZoomedH] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const bg = dark ? 'rgba(13, 16, 28, 0.85)' : 'rgba(248, 249, 252, 0.90)';

  const rPoints = useMemo(() => computePoints(lookup, year, 'r'),           [lookup, year]);
  const hPoints = useMemo(() => computePoints(lookup, year, healthMetric),  [lookup, year, healthMetric]);

  const hLabel = healthMetric === 'd' ? 'Depression prevalence (/100k)' : 'Anxiety prevalence (/100k)';
  const hTitle = healthMetric === 'd' ? 'Depressive Disorders'          : 'Anxiety Disorders';

  return (
    <BorderGlow
      className={inStack ? 'panel-stack-card' : 'float-panel visible'}
      backgroundColor={bg}
      borderRadius={22}
      glowRadius={5}
      glowIntensity={0.06}
      glowColor="249 115 22"
      edgeSensitivity={60}
      coneSpread={10}
      fillOpacity={0.01}
      colors={[R_COLOR, H_COLOR, '#f59e0b']}
    >
      <div className="fp-head">
        <div>
          <div className="fp-label">GDP income groups · {year}</div>
          <div className="fp-title-row">
            <h2>Light &amp; Health by Income Level</h2>
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
      </div>

      <p className="panel-desc">
        Countries are grouped into four income levels based on GDP per capita. Each column shows
        the spread of radiance and mental health disorder rates within that group: richer countries
        tend to emit significantly more light, while the health picture is more nuanced.
        {country && <> <strong>{country}</strong> is highlighted.</>}
      </p>

      <div className="chart-title">
        <span className="dot" style={{ background: R_COLOR }} />
        Radiance by income tier
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedR(true); }} title="Expand chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        )}
      </div>
      <IncomeGroupChart
        points={rPoints}
        country={country}
        compareCountry={compareCountry}
        color={R_COLOR}
        ylabel="nW/cm²/sr"
        dark={dark}
        height={inStack ? null : 180}
        logScale
      />

      <div className="chart-title" style={{ marginTop: 10 }}>
        <span className="dot" style={{ background: H_COLOR }} />
        {healthMetric === 'd' ? 'Depression' : 'Anxiety'} prevalence by income tier
        {country && (
          <button className="zoom-btn" onClick={e => { e.stopPropagation(); setZoomedH(true); }} title="Expand chart">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>
        )}
      </div>
      <IncomeGroupChart
        points={hPoints}
        country={country}
        compareCountry={compareCountry}
        color={H_COLOR}
        ylabel="/100k"
        dark={dark}
        height={inStack ? null : 180}
      />

      {zoomedR && (
        <ChartModal
          title="Radiance by Income Level"
          subtitle="Distribution across four GDP income groups"
          country={country}
          meta={String(year)}
          onClose={() => setZoomedR(false)}
        >
          <IncomeGroupChart points={rPoints} country={country} compareCountry={compareCountry} color={R_COLOR} ylabel="nW/cm²/sr" dark={dark} height={440} logScale />
        </ChartModal>
      )}
      {zoomedH && (
        <ChartModal
          title={hTitle}
          subtitle="Distribution across four GDP income groups"
          country={country}
          meta={String(year)}
          onClose={() => setZoomedH(false)}
        >
          <IncomeGroupChart points={hPoints} country={country} compareCountry={compareCountry} color={H_COLOR} ylabel="/100k" dark={dark} height={440} />
        </ChartModal>
      )}
    </BorderGlow>
  );
}
