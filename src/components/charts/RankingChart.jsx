import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ROW_H  = 34;
const MARGIN_WIDE   = { top: 8, right: 72, bottom: 24, left: 130 };
const MARGIN_NARROW = { top: 8, right: 48, bottom: 24, left: 96 };

export const RANK_METRICS = [
  { key: 'r',   label: 'Radiance',  unit: 'nW/cm²/sr', fmt: v => d3.format('.2f')(v) },
  { key: 'lgi', label: 'Growth',    unit: '% vs 2013',  fmt: v => (v >= 0 ? '+' : '') + d3.format('.1f')(v) + '%' },
  { key: 'e',   label: 'Energy',    unit: 'kWh/cap',    fmt: v => d3.format(',.0f')(v) },
  { key: 'u',   label: 'Urban',     unit: '% of pop.',  fmt: v => d3.format('.1f')(v) + '%' },
];

function getRanked(lookup, year, metricKey, topN) {
  const rows = [];
  for (const [country, yrs] of Object.entries(lookup)) {
    const entry = yrs[year];
    const val = entry?.[metricKey];
    if (val == null) continue;
    rows.push({ country, value: val });
  }
  rows.sort((a, b) => b.value - a.value);
  const sliced = topN != null ? rows.slice(0, topN) : rows;
  return sliced.map((d, i) => ({ ...d, rank: i }));
}

export default function RankingChart({ lookup, year, dark, country: selected, metric, onSelect, topN = 10 }) {
  const svgRef   = useRef(null);
  const stateRef = useRef(null);

  const ac = dark ? '#5b647d' : '#939bb2';
  const gc = dark ? '#2a3048' : '#e2e6ee';

  // Build the SVG skeleton (just groups, height/margin are set in the data effect)
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    el.innerHTML = '';

    const root = d3.select(el);
    const g    = root.append('g').attr('class', 'plot-area');

    g.append('g').attr('class', 'x-axis');
    g.append('g').attr('class', 'bars');

    stateRef.current = { g };
  }, [dark]);

  // Update bars on every year / metric / selection / topN change
  useEffect(() => {
    const el    = svgRef.current;
    const state = stateRef.current;
    if (!state || !lookup || !el) return;
    const { g } = state;

    const meta = RANK_METRICS.find(m => m.key === metric) || RANK_METRICS[0];
    const data = getRanked(lookup, year, metric, topN);
    if (!data.length) return;

    const n  = data.length;
    const W  = el.clientWidth || 320;
    const isNarrow = W < 400;
    const MARGIN = isNarrow ? MARGIN_NARROW : MARGIN_WIDE;
    const maxChars = isNarrow ? 13 : 18;
    const H  = ROW_H * n + MARGIN.top + MARGIN.bottom;
    const iw = W - MARGIN.left - MARGIN.right;

    g.attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    el.setAttribute('viewBox', `0 0 ${W} ${H}`);
    el.setAttribute('width',  W);
    el.setAttribute('height', H);

    g.select('.x-axis').attr('transform', `translate(0,${n * ROW_H})`);

    const maxVal = data[0].value;
    const x = d3.scaleLinear().domain([0, maxVal * 1.05]).range([0, iw]);

    g.select('.x-axis')
      .transition().duration(600)
      .call(d3.axisBottom(x).ticks(4).tickFormat(meta.fmt))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    const barsG = g.select('.bars');
    const join  = barsG.selectAll('g.bar-row').data(data, d => d.country);

    const enter = join.enter()
      .append('g').attr('class', 'bar-row')
      .attr('transform', d => `translate(0,${d.rank * ROW_H})`)
      .attr('opacity', 0)
      .style('cursor', onSelect ? 'pointer' : 'default')
      .on('click', (_, d) => onSelect && onSelect(d.country));

    enter.append('rect')
      .attr('class', 'bar')
      .attr('x', 0).attr('y', 4)
      .attr('height', ROW_H - 8).attr('rx', 3)
      .attr('width', d => Math.max(2, x(d.value)));

    enter.append('text')
      .attr('class', 'lbl-rank')
      .attr('x', -MARGIN.left).attr('y', ROW_H / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .style('font-size', '10px').style('font-family', 'inherit').style('font-variant-numeric', 'tabular-nums')
      .text(d => `${d.rank + 1}.`);

    enter.append('text')
      .attr('class', 'lbl-country')
      .attr('x', -6).attr('y', ROW_H / 2).attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', '11px').style('font-family', 'inherit')
      .text(d => d.country.length > maxChars ? d.country.slice(0, maxChars - 1) + '…' : d.country);

    enter.append('text')
      .attr('class', 'lbl-val')
      .attr('y', ROW_H / 2).attr('dy', '0.35em')
      .style('font-size', '10px').style('font-family', 'inherit').style('font-weight', '600');

    const merged = join.merge(enter);

    merged.transition().duration(700).ease(d3.easeCubicInOut)
      .attr('transform', d => `translate(0,${d.rank * ROW_H})`)
      .attr('opacity', 1);

    const metricColor = { r: '#f59e0b', lgi: 'var(--lgi)', e: '#10b981', u: '#06b6d4' };
    const barColor    = metricColor[metric] || 'var(--lgi)';

    merged.select('rect.bar')
      .transition().duration(700).ease(d3.easeCubicInOut)
      .attr('width', d => Math.max(2, x(d.value)))
      .attr('fill',  d => d.country === selected ? 'var(--lgr)' : barColor);

    merged.select('text.lbl-rank')
      .attr('x', -MARGIN.left)
      .attr('fill', ac)
      .text(d => `${d.rank + 1}.`);

    merged.select('text.lbl-country')
      .attr('fill',        d => d.country === selected ? 'var(--lgr)' : (dark ? '#c8d0e8' : '#1e2540'))
      .style('font-weight', d => d.country === selected ? '700' : '400')
      .text(d => d.country.length > maxChars ? d.country.slice(0, maxChars - 1) + '…' : d.country);

    merged.select('text.lbl-val')
      .transition().duration(700).ease(d3.easeCubicInOut)
      .attr('x',    d => Math.max(2, x(d.value)) + 5)
      .attr('fill', d => d.country === selected ? 'var(--lgr)' : ac)
      .text(d => meta.fmt(d.value));

    join.exit().transition().duration(400).attr('opacity', 0).remove();

  }, [lookup, year, metric, selected, dark, topN]);

  return (
    <svg ref={svgRef} style={{ width: '100%', overflow: 'visible', display: 'block' }} />
  );
}
