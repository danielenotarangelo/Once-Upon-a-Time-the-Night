import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';

export default function QuadrantChart({ lookup, year, selected, compareCountry, healthMetric, dark, height }) {
  const { t } = useTranslation();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    el.innerHTML = '';

    const W = el.clientWidth || 286;
    const H = el.clientHeight || height || 260;
    const m = { top: 16, right: 12, bottom: 36, left: 44 };
    const iw = W - m.left - m.right;
    const ih = H - m.top - m.bottom;
    const ac = dark ? '#5b647d' : '#939bb2';
    const gc = dark ? '#2a3048' : '#e2e6ee';
    const bg = dark ? '#0d101c' : '#f8f9fc';

    const pts = [];
    for (const c in lookup) {
      const y = lookup[c][year];
      if (y && y.r != null && y[healthMetric] != null) {
        pts.push({ country: c, r: y.r, h: y[healthMetric] });
      }
    }
    if (!pts.length) return;

    const medR = d3.median(pts, d => d.r);
    const medH = d3.median(pts, d => d.h);

    const x = d3.scaleLog()
      .domain([0.03, (d3.max(pts, d => d.r) || 1) * 1.2])
      .range([0, iw])
      .clamp(true);
    const y = d3.scaleLinear()
      .domain([(d3.min(pts, d => d.h) || 0) * 0.9, (d3.max(pts, d => d.h) || 1) * 1.05])
      .range([ih, 0]);

    d3.select(el).style('position', 'relative');
    const svg = d3.select(el).append('svg').attr('width', W).attr('height', H);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const qx = x(medR);
    const qy = y(medH);

    // Subtle quadrant fills
    const alpha = dark ? 0.18 : 0.22;
    g.append('rect').attr('x', 0).attr('y', 0).attr('width', qx).attr('height', qy)
      .attr('fill', dark ? '#1e3040' : '#dbeafe').attr('opacity', alpha);
    g.append('rect').attr('x', qx).attr('y', 0).attr('width', iw - qx).attr('height', qy)
      .attr('fill', dark ? '#3a1e30' : '#fce7f3').attr('opacity', alpha);
    g.append('rect').attr('x', 0).attr('y', qy).attr('width', qx).attr('height', ih - qy)
      .attr('fill', dark ? '#1e3a1e' : '#dcfce7').attr('opacity', alpha);
    g.append('rect').attr('x', qx).attr('y', qy).attr('width', iw - qx).attr('height', ih - qy)
      .attr('fill', dark ? '#3a3a1e' : '#fefce8').attr('opacity', alpha);

    // Axes
    g.append('g').attr('transform', `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(4, '~s'))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('~s')))
      .call(s => s.selectAll('text').attr('fill', ac).style('font-size', '9px'))
      .call(s => s.selectAll('line,path').attr('stroke', gc));

    g.append('text')
      .attr('x', iw / 2).attr('y', ih + 30)
      .attr('text-anchor', 'middle').attr('fill', ac).style('font-size', '9px')
      .text(t('panels.quadrant.axisX'));

    // Median dividers
    g.append('line').attr('x1', qx).attr('x2', qx).attr('y1', 0).attr('y2', ih)
      .attr('stroke', ac).attr('stroke-dasharray', '3,2').attr('opacity', 0.55);
    g.append('line').attr('x1', 0).attr('x2', iw).attr('y1', qy).attr('y2', qy)
      .attr('stroke', ac).attr('stroke-dasharray', '3,2').attr('opacity', 0.55);


    // Dots — selected and compare rendered last so they sit on top
    const highlighted = new Set([selected, compareCountry].filter(Boolean));
    const others = pts.filter(d => !highlighted.has(d.country));
    const selPt = pts.find(d => d.country === selected);
    const cmpPt = compareCountry ? pts.find(d => d.country === compareCountry) : null;

    g.selectAll('circle.pt').data(others).enter().append('circle')
      .attr('class', 'pt')
      .attr('cx', d => x(d.r))
      .attr('cy', d => y(d.h))
      .attr('r', 3)
      .attr('fill', 'var(--health)')
      .attr('opacity', 0.35);

    if (cmpPt) {
      g.append('circle')
        .attr('cx', x(cmpPt.r)).attr('cy', y(cmpPt.h)).attr('r', 6)
        .attr('fill', '#38bdf8').attr('stroke', bg).attr('stroke-width', 2);
      const cx2 = x(cmpPt.r);
      const cy2 = y(cmpPt.h);
      const cmpLabelRight = cx2 < iw * 0.75;
      g.append('text')
        .attr('x', cmpLabelRight ? cx2 + 9 : cx2 - 9)
        .attr('y', cy2 + 3)
        .attr('text-anchor', cmpLabelRight ? 'start' : 'end')
        .attr('fill', '#38bdf8')
        .style('font-size', '11px').style('font-weight', '600')
        .text(cmpPt.country);
    }

    if (selPt) {
      const selColor = compareCountry ? '#f59e0b' : 'var(--accent)';
      g.append('circle')
        .attr('cx', x(selPt.r)).attr('cy', y(selPt.h)).attr('r', 6)
        .attr('fill', selColor).attr('stroke', bg).attr('stroke-width', 2);
      const sx = x(selPt.r);
      const sy = y(selPt.h);
      const labelRight = sx < iw * 0.75;
      g.append('text')
        .attr('x', labelRight ? sx + 9 : sx - 9)
        .attr('y', sy + 3)
        .attr('text-anchor', labelRight ? 'start' : 'end')
        .attr('fill', selColor)
        .style('font-size', '11px').style('font-weight', '600')
        .text(selPt.country);
    }

    // Hover tooltip
    const tip = d3.select(el).append('div').attr('class', 'chart-hover-tip').style('display', 'none');

    g.append('rect').attr('width', iw).attr('height', ih)
      .attr('fill', 'none').attr('pointer-events', 'all')
      .on('mousemove', function(event) {
        const [mx, my] = d3.pointer(event);
        let best = null, bestDist = Infinity;
        for (const pt of pts) {
          const dx = x(pt.r) - mx, dy = y(pt.h) - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) { bestDist = dist; best = pt; }
        }
        if (!best || bestDist > 32) { tip.style('display', 'none'); return; }
        const px = x(best.r) + m.left;
        const flipRight = px > W * 0.6;
        const bright = best.r > medR;
        const high = best.h > medH;
        const quadrant = (bright ? 'Bright' : 'Dim') + ' · ' + (high ? 'high disorders' : 'low disorders');
        tip.style('display', 'block')
          .style('left', flipRight ? null : px + 10 + 'px')
          .style('right', flipRight ? W - px + 10 + 'px' : null)
          .style('top', m.top + 'px')
          .html(`<div class="tip-year">${best.country}</div>
            <div class="tip-row"><span class="tip-dot" style="background:var(--accent)"></span>${d3.format('.2f')(best.r)} nW/cm²/sr</div>
            <div class="tip-row"><span class="tip-dot" style="background:var(--health)"></span>${d3.format(',.0f')(best.h)}/100k</div>
            <div style="font-size:9px;opacity:0.55;margin-top:3px">${quadrant}</div>`);
      })
      .on('mouseleave', () => tip.style('display', 'none'));

  }, [lookup, year, selected, compareCountry, healthMetric, dark, height, t]);

  return <div ref={ref} className="chart" style={height != null ? { height } : undefined} />;
}
