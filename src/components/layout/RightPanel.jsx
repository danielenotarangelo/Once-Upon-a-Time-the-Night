import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import RadianceGDPPanel from '../charts/RadianceGDPPanel.jsx';
import LightGDPRatioPanel from '../charts/LightGDPRatioPanel.jsx';
import QuadrantPanel from '../charts/QuadrantPanel.jsx';
import HealthTrendPanel from '../charts/HealthTrendPanel.jsx';
import EnergyPanel from '../charts/EnergyPanel.jsx';
import IncomeGroupPanel from '../charts/IncomeGroupPanel.jsx';
import Stack from '../ui/Stack.jsx';

const TABS = ['wealth', 'health', 'environment', 'context'];

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11,4 6,9 11,14" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="7,4 12,9 7,14" />
    </svg>
  );
}

export default function RightPanel({ lookup, country, compareCountry, year, dark, healthMetric = 'd' }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('wealth');
  const [dir, setDir] = useState('left');

  useEffect(() => { setTab('wealth'); }, [country]);

  const visible = !!country;

  const shared  = { lookup, country, compareCountry, year, dark, inStack: true };
  const sharedH = { ...shared, healthMetric };

  const wealthCards = [
    <RadianceGDPPanel  key="left" {...shared} />,
    <LightGDPRatioPanel   key="lgr"  {...shared} />,
  ];
  const healthCards = [
    <HealthTrendPanel key="trajectory" {...sharedH} />,
    <QuadrantPanel   key="quadrant"   {...sharedH} />,
  ];
  const environmentCards = [
    <EnergyPanel key="energy" {...shared} />,
  ];
  const contextCards = [
    <IncomeGroupPanel key="tier" {...sharedH} />,
  ];

  const tabIdx  = TABS.indexOf(tab);
  const prevTab = () => { setDir('right'); setTab(TABS[(tabIdx - 1 + TABS.length) % TABS.length]); };
  const nextTab = () => { setDir('left');  setTab(TABS[(tabIdx + 1) % TABS.length]); };

  const activeCards =
    tab === 'wealth'      ? wealthCards :
    tab === 'health'      ? healthCards :
    tab === 'environment' ? environmentCards :
                            contextCards;

  return (
    <div className={`right-panel${visible ? ' visible' : ''}`}>

      {/* Chart area — fills full panel height */}
      <div key={tab} className={`rp-mode-content rp-mode-content--${dir}`}>
        {country && (
          <div className="rp-stack-wrapper">
            <Stack
              key={`${tab}-${country}`}
              sendToBackOnClick
              sensitivity={180}
              cards={activeCards}
            />
          </div>
        )}
      </div>

      {/* Tab navigator — fixed below the panel */}
      <div className="rp-tab-nav">
        <button className="rp-nav-arrow" onClick={prevTab} aria-label={t('panels.tabs.prev')}>
          <ChevronLeft />
        </button>
        <span className="rp-nav-label">{t(`panels.tabs.${TABS[tabIdx >= 0 ? tabIdx : 0]}`)}</span>
        <button className="rp-nav-arrow" onClick={nextTab} aria-label={t('panels.tabs.next')}>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
}
