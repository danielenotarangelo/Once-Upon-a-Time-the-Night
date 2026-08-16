import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';

const COLOR_A = '#f59e0b';
const COLOR_B = '#38bdf8';

export default function RadianceGDPChart({ series, compareSeries, year, dark, height }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const d3Ref = useRef(null);

  useEffect(() => {
    d3Ref.current = null;
    const el = containerRef.current;
    el.innerHTML = '';
    el.style.cssText = '';
    if (!series?.length) return;

    const isCompare = !!(compareSeries?.length);
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    if (isCompare) {
      const totalH   = height ?? el.clientHeight ?? 240;
      const miniH    = Math.max(70, Math.floor((totalH - 8) / 2));
      const W        = el.clientWidth || 286;

      el.style.cssText = `display:flex;flex-direction:column;gap:8px;${height != null ? `height:${height}px;` : ''}`;

      const buildMini = (yKey, label, fmtTick) => {
        const div = document.createElement('div');
        div.style.cssText = 'position:relative;flex:1;';
        el.appendChild(div);

        const H  = miniH;
        const m  = { top: 16, right: 10, bottom: 20, left: 42 };
        const iw = W - m.left - m.right;
        const ih = H - m.top - m.bottom;

        const allVals = [...series, ...compareSeries].map(d => d[yKey]).filter(v => v != null);
        const x = d3.scaleLinear().domain(d3.extent(series, d => d.year)).range([0, iw]);
        const y = d3.scaleLinear().domain([0, (d3.max(allVals) || 1) * 1.1]).range([ih, 0]);

        const svg = d3.select(div).append('svg').attr('width', W).attr('height', H);

        // Mini-chart label
        svg.append('text')
          .attr('x', m.left).attr('y', 9)
          .attr('fill', ac)
          .style('font-size', '8px').style('font-weight', '700').style('letter-spacing', '0.06em')
          .text(label);

        const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

        g.append('g').attr('transform', `translate(0,${ih})`)
          .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
          .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
          .call(s => s.selectAll('line,path').attr('stroke', gc));
        g.append('g')
          .call(d3.axisLeft(y).ticks(3).tickFormat(fmtTick))
          .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
          .call(s => s.selectAll('line,path').attr('stroke', gc));

        const line = d3.line().defined(d => d[yKey] != null)
          .x(d => x(d.year)).y(d => y(d[yKey])).curve(d3.curveMonotoneX);

        g.append('path').datum(series).attr('fill', 'none')
          .attr('stroke', COLOR_A).attr('stroke-width', 2).attr('d', line);
        g.append('path').datum(compareSeries).attr('fill', 'none')
          .attr('stroke', COLOR_B).attr('stroke-width', 2).attr('d', line);

        // Year marker
        const markerG = g.append('g').style('display', 'none');
        const mLine   = markerG.append('line').attr('y1', 0).attr('y2', ih)
          .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.4);
        const mDotA = markerG.append('circle').attr('r', 4)
          .attr('fill', COLOR_A).attr('stroke', bg).attr('stroke-width', 2);
        const mDotB = markerG.append('circle').attr('r', 4)
          .attr('fill', COLOR_B).attr('stroke', bg).attr('stroke-width', 2);

        // Hover
        const tip = d3.select(div).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
        g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
          .on('mousemove', function(event) {
            const [mx]  = d3.pointer(event);
            const yr    = Math.round(x.invert(mx));
            const da    = series.find(d => d.year === yr);
            const db    = compareSeries.find(d => d.year === yr);
            if (!da) return;
            const px        = x(yr);
            const flipRight = px + m.left > W * 0.6;
            const valA = da[yKey], valB = db?.[yKey];
            const fmt  = yKey === 'g'
              ? v => v >= 1000 ? '$' + d3.format(',.0f')(v) : '$' + v
              : v => d3.format('.2f')(v) + ' nW/cm²/sr';
            let html = `<div class="tip-year">${yr}</div>
              <div class="tip-row"><span class="tip-dot" style="background:${COLOR_A}"></span>${valA != null ? fmt(valA) : '—'}</div>`;
            if (db) html += `<div class="tip-row"><span class="tip-dot" style="background:${COLOR_B}"></span>${valB != null ? fmt(valB) : '—'}</div>`;
            tip.style('display', 'block')
              .style('left',  flipRight ? null : px + m.left + 8 + 'px')
              .style('right', flipRight ? W - px - m.left + 8 + 'px' : null)
              .style('top', m.top + 'px')
              .html(html);
          })
          .on('mouseleave', () => tip.style('display', 'none'));

        return { x, y, yKey, markerG, mLine, mDotA, mDotB };
      };

      const fmtR = d3.format('.1f');
      const fmtG = d => d >= 1000 ? d3.format('.0s')(d) : d;

      const chartR = buildMini('r', t('panels.radianceGdp.miniRadiance'), fmtR);
      const chartG = buildMini('g', t('panels.radianceGdp.miniGdp'), fmtG);

      d3Ref.current = { isCompare: true, chartR, chartG };
      return;
    }

    // ── Solo mode: dual-axis chart ─────────────────────────────────
    const W  = el.clientWidth || 286;
    const H  = el.clientHeight || height || 240;
    const m  = { top: 12, right: 42, bottom: 22, left: 42 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g   = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const allR = series.map(d => d.r).filter(v => v != null);
    const allG = series.map(d => d.g).filter(v => v != null);
    const x  = d3.scaleLinear().domain(d3.extent(series, d => d.year)).range([0, iw]);
    const yR = d3.scaleLinear().domain([0, (d3.max(allR) || 1) * 1.1]).range([ih, 0]);
    const yG = d3.scaleLinear().domain([0, (d3.max(allG) || 1) * 1.1]).range([ih, 0]);

    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(yR).ticks(4))
      .call(s => s.selectAll('text').attr('fill', 'var(--radiance)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g').attr('transform', `translate(${iw},0)`)
      .call(d3.axisRight(yG).ticks(4).tickFormat(d => d >= 1000 ? d3.format('.0s')(d) : d))
      .call(s => s.selectAll('text').attr('fill', 'var(--gdp)').style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    g.append('path').datum(series).attr('fill', 'none').attr('stroke', 'var(--radiance)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => yR(d.r)).curve(d3.curveMonotoneX));
    g.append('path').datum(series).attr('fill', 'none').attr('stroke', 'var(--gdp)').attr('stroke-width', 2)
      .attr('d', d3.line().x(d => x(d.year)).y(d => yG(d.g)).curve(d3.curveMonotoneX));

    const markerG = g.append('g').style('display', 'none');
    const mLine   = markerG.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '2,2').attr('opacity', 0.4);
    const mDotR = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--radiance)').attr('stroke', bg).attr('stroke-width', 2);
    const mDotG = markerG.append('circle').attr('r', 4)
      .attr('fill', 'var(--gdp)').attr('stroke', bg).attr('stroke-width', 2);

    const crosshair = g.append('g').style('display', 'none').style('pointer-events', 'none');
    const vline = crosshair.append('line').attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-width', 1).attr('stroke-dasharray', '3,2');
    const dotR = crosshair.append('circle').attr('r', 4)
      .attr('fill', 'var(--radiance)').attr('stroke', bg).attr('stroke-width', 2);
    const dotG = crosshair.append('circle').attr('r', 4)
      .attr('fill', 'var(--gdp)').attr('stroke', bg).attr('stroke-width', 2);

    const tip    = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');
    const bisect = d3.bisector(d => d.year).center;
    const fmtR   = d3.format('.2f');
    const fmtG   = v => v >= 1000 ? d3.format(',.0f')(v) : String(v);

    g.append('rect').attr('width', iw).attr('height', ih).attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const idx  = bisect(series, x.invert(mx));
        const d    = series[Math.max(0, Math.min(idx, series.length - 1))];
        if (!d) return;
        const px = x(d.year);
        crosshair.style('display', null);
        vline.attr('x1', px).attr('x2', px);
        dotR.attr('cx', px).attr('cy', yR(d.r));
        dotG.attr('cx', px).attr('cy', yG(d.g));
        const tipX      = px + m.left;
        const flipRight = tipX > W * 0.6;
        tip.style('display', 'block')
          .style('left',  flipRight ? null : tipX + 10 + 'px')
          .style('right', flipRight ? W - tipX + 10 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${d.year}</div>` +
            `<div class="tip-row"><span class="tip-dot" style="background:var(--radiance)"></span>${fmtR(d.r)} nW/cm²/sr</div>` +
            `<div class="tip-row"><span class="tip-dot" style="background:var(--gdp)"></span>$${fmtG(d.g)}</div>`);
      })
      .on('mouseleave', function() {
        crosshair.style('display', 'none');
        tip.style('display', 'none');
      });

    d3Ref.current = { isCompare: false, x, yR, yG, markerG, mLine, mDotR, mDotG };
  }, [series, compareSeries, dark, height, t]);

  useEffect(() => {
    const state = d3Ref.current;
    if (!state) return;

    if (state.isCompare) {
      const updateMini = (chart) => {
        const { x, y, yKey, markerG, mLine, mDotA, mDotB } = chart;
        const cy = series?.find(d => d.year === year);
        const cc = compareSeries?.find(d => d.year === year);
        if (!cy) { markerG.style('display', 'none'); return; }
        markerG.style('display', null);
        mLine.attr('x1', x(year)).attr('x2', x(year));
        mDotA.attr('cx', x(year)).attr('cy', y(cy[yKey]));
        if (cc) mDotB.attr('cx', x(year)).attr('cy', y(cc[yKey]));
      };
      updateMini(state.chartR);
      updateMini(state.chartG);
    } else {
      const { x, yR, yG, markerG, mLine, mDotR, mDotG } = state;
      const cy = series?.find(d => d.year === year);
      if (!cy) { markerG.style('display', 'none'); return; }
      markerG.style('display', null);
      mLine.attr('x1', x(cy.year)).attr('x2', x(cy.year));
      mDotR.attr('cx', x(cy.year)).attr('cy', yR(cy.r));
      mDotG.attr('cx', x(cy.year)).attr('cy', yG(cy.g));
    }
  }, [year, series, compareSeries, dark, height]);

  return <div ref={containerRef} className="chart" style={height != null ? { height } : undefined} />;
}
