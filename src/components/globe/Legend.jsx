import { useTranslation } from 'react-i18next';
import { VAR_META } from '../../lib/constants.js';
import { activeVarKey, fmt } from '../../lib/data.js';

export default function Legend({ domains, variable, healthMetric, hidden = false }) {
  const { t } = useTranslation();
  const k = activeVarKey(variable, healthMetric);
  const meta = VAR_META[k];
  const dom = domains[k];

  const stops = [];
  for (let i = 0; i <= 10; i++) stops.push(meta.interp(i / 10));
  const gradient = `linear-gradient(90deg, ${stops.join(',')})`;

  return (
    <div className={`legend${hidden ? ' legend-hidden' : ''}`}>
      <div className="legend-title">{t(meta.labelKey)}</div>
      <div className="legend-bar" style={{ background: gradient }} />
      <div className="legend-scale">
        <span>{fmt(dom.min, k)}</span>
        <span>{fmt(dom.max, k)}</span>
      </div>
    </div>
  );
}
