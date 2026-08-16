import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import './Results.css';

const YEARS = [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const TIER_COLORS = ['#60a5fa', '#818cf8', '#a78bfa', '#c084fc'];


// ── Mini chart components ────────────────────────────────────────────────────

function TrendBars({ vals, years, highlightYear }) {
  const W = 560, H = 108, PL = 4, PR = 4, PT = 6, PB = 22;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...vals);
  const bW = cW / years.length;
  const gap = 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="results-mini-svg">
      {vals.map((v, i) => {
        const bH = (v / max) * cH;
        const x = PL + i * bW;
        const hl = years[i] === highlightYear;
        const showLabel = i === 0 || i === years.length - 1 || hl;
        return (
          <g key={years[i]}>
            <rect
              className="r-bar-v"
              style={{ animationDelay: `${i * 0.03}s` }}
              x={x + gap / 2} y={PT + cH - bH}
              width={bW - gap} height={bH}
              fill={hl ? '#f59e0b' : '#60a5fa'}
              opacity={highlightYear && !hl ? 0.32 : 0.85}
              rx={2}
            />
            {showLabel && (
              <text x={x + bW / 2} y={H - 5} textAnchor="middle"
                fontSize={9} fill="currentColor" opacity={0.45}>
                {years[i]}
              </text>
            )}
          </g>
        );
      })}
      {highlightYear && (() => {
        const i = years.indexOf(highlightYear);
        const bH = (vals[i] / max) * cH;
        const x = PL + i * bW + gap / 2;
        const y = PT + cH - bH - 14;
        return (
          <text x={x + (bW - gap) / 2} y={y} textAnchor="middle"
            fontSize={9} fontWeight="700" fill="#f59e0b" opacity={0.9}>
            {highlightYear}
          </text>
        );
      })()}
    </svg>
  );
}

function HBarChart({ vals, labels, fmt = (v) => v.toFixed(2) }) {
  const W = 500, H = 114, PL = 84, PR = 70, PT = 4, PB = 4;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...vals);
  const rowH = cH / vals.length;
  const pad = 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="results-mini-svg">
      {vals.map((v, i) => {
        const bW = (v / max) * cW;
        const y = PT + i * rowH;
        return (
          <g key={labels[i]}>
            <text x={PL - 8} y={y + rowH / 2 + 3.5} textAnchor="end"
              fontSize={10} fill="currentColor" opacity={0.5}>
              {labels[i]}
            </text>
            <rect
              className="r-bar-h"
              style={{ animationDelay: `${i * 0.08}s` }}
              x={PL} y={y + pad / 2}
              width={bW} height={rowH - pad}
              fill={TIER_COLORS[i]} opacity={0.82} rx={3}
            />
            <text x={PL + bW + 7} y={y + rowH / 2 + 3.5}
              fontSize={10} fill="currentColor" opacity={0.55}>
              {fmt(v)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ScatterPlot({ points, xLabel, yLabel }) {
  const W = 540, H = 150, PL = 32, PR = 16, PT = 10, PB = 26;
  const cW = W - PL - PR, cH = H - PT - PB;
  if (!points || points.length === 0) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const logMin = Math.log10(Math.max(Math.min(...xs), 0.01));
  const logMax = Math.log10(Math.max(...xs));
  const yMin = Math.min(...ys), yMax = Math.max(...ys);

  const xPos = (v) => PL + ((Math.log10(Math.max(v, 0.01)) - logMin) / (logMax - logMin)) * cW;
  const yPos = (v) => PT + cH - ((v - yMin) / (yMax - yMin)) * cH;

  const lxs = xs.map((x) => Math.log10(Math.max(x, 0.01)));
  const n = points.length;
  const mlx = lxs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  const slope = lxs.reduce((s, lx, i) => s + (lx - mlx) * (ys[i] - my), 0) /
                lxs.reduce((s, lx) => s + (lx - mlx) ** 2, 0);
  const intercept = my - slope * mlx;
  const ty1 = yPos(slope * logMin + intercept);
  const ty2 = yPos(slope * logMax + intercept);

  const xTicks = [0.5, 1, 2, 5, 10, 20, 50].filter((v) => v >= Math.pow(10, logMin) * 0.7 && v <= Math.pow(10, logMax) * 1.4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="results-mini-svg">
      <line x1={PL} y1={PT + cH} x2={PL + cW} y2={PT + cH} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
      <line x1={PL} y1={PT} x2={PL} y2={PT + cH} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
      <line className="r-line" style={{ animationDelay: '0.3s' }}
        x1={PL} y1={ty1} x2={PL + cW} y2={ty2}
        stroke="#a78bfa" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.55} />
      {points.map((p, i) => (
        <circle key={i} className="r-dot" style={{ animationDelay: `${0.05 + i * 0.018}s` }}
          cx={xPos(p.x)} cy={yPos(p.y)} r={3.5}
          fill="#60a5fa" opacity={0.72} />
      ))}
      {xTicks.map((v) => (
        <text key={v} x={xPos(v)} y={H - 8} textAnchor="middle"
          fontSize={8.5} fill="currentColor" opacity={0.4}>
          {v}
        </text>
      ))}
      <text x={PL + cW / 2} y={H - 1} textAnchor="middle"
        fontSize={8.5} fill="currentColor" opacity={0.35}>
        {xLabel}
      </text>
      <text x={10} y={PT + cH / 2} textAnchor="middle"
        fontSize={8.5} fill="currentColor" opacity={0.35}
        transform={`rotate(-90, 10, ${PT + cH / 2})`}>
        {yLabel}
      </text>
    </svg>
  );
}

// ── Slide definitions ────────────────────────────────────────────────────────

// Copy lives in the locale files under results.slides.<id>
const SLIDES = [
  { id: 'intro',      big:   true      },
  { id: 'brighter',   chart: 'trend'   },
  { id: 'africa',     icon:  'growth'  },
  { id: 'covid',      chart: 'covid'   },
  { id: 'income',     chart: 'tier-r'  },
  { id: 'energy',     chart: 'tier-e'  },
  { id: 'depression', chart: 'tier-d'  },
  { id: 'anxiety',    chart: 'tier-a'  },
  { id: 'highIncome', chart: 'scatter' },
  { id: 'darker',     icon:  'dim'     },
  { id: 'synthesis',  icon:  'globe'   },
];

const ICONS = {
  globe: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="3.5" ry="9"/>
      <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    </svg>
  ),
  growth: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  dim: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/>
      <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/>
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth="1" strokeDasharray="2,2"/>
    </svg>
  ),
};

// ── Main component ───────────────────────────────────────────────────────────

export default function Results({ onClose, data }) {
  const { t } = useTranslation();
  const [leaving,  setLeaving]  = useState(false);
  const [visible,  setVisible]  = useState(() => new Array(SLIDES.length).fill(false));
  const sectionRefs = useRef([]);

  const computed = useMemo(() => {
    if (!data) return null;
    const entries = Object.values(data.lookup);

    const globalRadiance = YEARS.map((yr) => {
      const vs = entries.map((e) => e[yr]?.r).filter((v) => v != null);
      return d3.median(vs) ?? 0;
    });

    const y23full = entries
      .map((e) => ({ r: e[2023]?.r, g: e[2023]?.g, dep: e[2023]?.d, anx: e[2023]?.a, energy: e[2023]?.e }))
      .filter((e) => e.g != null && e.r != null);
    y23full.sort((a, b) => a.g - b.g);
    const gdpsFull = y23full.map((e) => e.g);
    const q1f = d3.quantile(gdpsFull, 0.25);
    const q2f = d3.quantile(gdpsFull, 0.50);
    const q3f = d3.quantile(gdpsFull, 0.75);
    const tiersF = [[], [], [], []];
    y23full.forEach((e) => {
      const t = e.g <= q1f ? 0 : e.g <= q2f ? 1 : e.g <= q3f ? 2 : 3;
      tiersF[t].push(e);
    });

    const tierRadiance   = tiersF.map((t) => d3.median(t.map((e) => e.r)) ?? 0);
    const tierDepression = tiersF.map((t) => {
      const ds = t.map((e) => e.dep).filter((v) => v != null);
      return ds.length ? (d3.median(ds) ?? 0) : 0;
    });
    const tierAnxiety = tiersF.map((t) => {
      const as = t.map((e) => e.anx).filter((v) => v != null);
      return as.length ? (d3.median(as) ?? 0) : 0;
    });
    const tierEnergy = tiersF.map((t) => {
      const es = t.map((e) => e.energy).filter((v) => v != null);
      return es.length ? (d3.median(es) ?? 0) : 0;
    });
    const scatterPoints = tiersF[3]
      .filter((e) => e.dep != null)
      .map((e) => ({ x: e.r, y: e.dep }));

    return { globalRadiance, tierRadiance, tierDepression, tierAnxiety, tierEnergy, scatterPoints };
  }, [data]);

  const tierLabels = [
    t('results.tiers.low'),
    t('results.tiers.lowerMid'),
    t('results.tiers.upperMid'),
    t('results.tiers.high'),
  ];

  const close = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, 600);
  }, [leaving, onClose]);

  // Chart mounting: mount charts once section has scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((prev) => {
          let changed = false;
          const next = [...prev];
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Number(entry.target.dataset.idx);
              if (!next[idx]) { next[idx] = true; changed = true; }
            }
          });
          return changed ? next : prev;
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -180px 0px' }
    );
    sectionRefs.current.forEach((ref) => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);


  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div className={`results${leaving ? ' leaving' : ''}`}>

      <button className="results-close" onClick={close} aria-label={t('results.close')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div className="results-scroll">
        {SLIDES.map((slide, i) => {
          const hasChart = !!slide.chart;
          const isIntro  = i === 0;
          const base     = `results.slides.${slide.id}`;
          const eyebrow  = t(`${base}.eyebrow`,  { defaultValue: '' });
          const stat     = t(`${base}.stat`,     { defaultValue: '' });
          const statNote = t(`${base}.statNote`, { defaultValue: '' });
          return (
            <section
              key={slide.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              data-idx={i}
              className={`results-section${visible[i] ? ' visible' : ''}${hasChart ? ' has-chart' : ''}${isIntro ? ' is-intro' : ''}`}
            >
              <div className="results-section-text">
                {slide.icon && <div className="results-icon">{ICONS[slide.icon]}</div>}
                {eyebrow && <p className="results-eyebrow">{eyebrow}</p>}
                {stat && (
                  <div className="results-stat-block">
                    <span className="results-stat">{stat}</span>
                    {statNote && <span className="results-stat-note">{statNote}</span>}
                  </div>
                )}
                <h2 className={`results-title${slide.big ? ' big' : ''}`}>{t(`${base}.title`)}</h2>
                <p className="results-desc">{t(`${base}.body`)}</p>
              </div>

              {hasChart && computed && visible[i] && (
                <div className="results-section-chart">
                  {slide.chart === 'trend'   && <TrendBars vals={computed.globalRadiance} years={YEARS} />}
                  {slide.chart === 'covid'   && <TrendBars vals={computed.globalRadiance} years={YEARS} highlightYear={2020} />}
                  {slide.chart === 'tier-r'  && <HBarChart vals={computed.tierRadiance}   labels={tierLabels} fmt={(v) => `${v.toFixed(2)} nW`} />}
                  {slide.chart === 'tier-d'  && <HBarChart vals={computed.tierDepression} labels={tierLabels} fmt={(v) => v.toFixed(0)} />}
                  {slide.chart === 'tier-a'  && <HBarChart vals={computed.tierAnxiety}    labels={tierLabels} fmt={(v) => v.toFixed(0)} />}
                  {slide.chart === 'tier-e'  && <HBarChart vals={computed.tierEnergy}     labels={tierLabels} fmt={(v) => `${(v / 1000).toFixed(1)}k kWh`} />}
                  {slide.chart === 'scatter' && <ScatterPlot points={computed.scatterPoints} xLabel={t('results.scatterX')} yLabel={t('results.scatterY')} />}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
