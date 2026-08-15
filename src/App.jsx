import { useState, useCallback, useEffect } from 'react';
import Header from './components/layout/Header.jsx';
import Legend from './components/globe/Legend.jsx';
import Globe from './components/globe/Globe.jsx';
import RadianceGDPPanel from './components/charts/RadianceGDPPanel.jsx';
import RadianceGrowthPanel from './components/charts/RadianceGrowthPanel.jsx';
import LightGDPRatioPanel from './components/charts/LightGDPRatioPanel.jsx';
import QuadrantPanel from './components/charts/QuadrantPanel.jsx';
import HealthTrendPanel from './components/charts/HealthTrendPanel.jsx';
import EnergyPanel from './components/charts/EnergyPanel.jsx';
import IncomeGroupPanel from './components/charts/IncomeGroupPanel.jsx';
import RightPanel from './components/layout/RightPanel.jsx';
import MobilePanelCarousel from './components/layout/MobilePanelCarousel.jsx';
import RankingPanel from './components/charts/RankingPanel.jsx';
import OverviewBar from './components/layout/OverviewBar.jsx';
import CompareBar from './components/layout/CompareBar.jsx';
import Timeline from './components/globe/Timeline.jsx';
import DotField from './components/ui/DotField.jsx';
import Galaxy from './components/ui/Galaxy.jsx';
import Landing from './components/layout/Landing.jsx';
import Results from './components/layout/Results.jsx';
import { AnimatePresence } from 'motion/react';
import { useData } from './hooks/useData.js';

export default function App() {
  const { data, geo, loading, error } = useData();
  const [year, setYear] = useState(2013);
  const [variable, setVariable] = useState(null);
  const [healthMetric] = useState('d');
  const [selected, setSelected] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [dark, setDark] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  const [compareCountry, setCompareCountry] = useState(null);
  const [compareMode,    setCompareMode]    = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [isSmallPhone, setIsSmallPhone] = useState(() => window.innerWidth <= 400);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth <= 640);
      setIsSmallPhone(window.innerWidth <= 400);
    };
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const update = () => {
      const timelineEl = document.querySelector('.timeline');
      const legendEl   = document.querySelector('.legend');
      const headerEl   = document.querySelector('header');
      if (!timelineEl) return;

      const timelineTop = timelineEl.getBoundingClientRect().top;
      const topBound    = legendEl
        ? legendEl.getBoundingClientRect().bottom
        : (headerEl ? headerEl.getBoundingClientRect().bottom : 0);

      const centerY    = (topBound + timelineTop) / 2;
      const maxPanelH  = Math.max(200, timelineTop - topBound - 40);
      const legendBot  = legendEl ? legendEl.getBoundingClientRect().bottom : topBound;

      document.documentElement.style.setProperty('--panel-center-y',  `${centerY}px`);
      document.documentElement.style.setProperty('--panel-max-height', `${maxPanelH}px`);
      document.documentElement.style.setProperty('--legend-bottom',    `${legendBot}px`);
      document.documentElement.style.setProperty('--timeline-top',     `${timelineTop}px`);
    };

    requestAnimationFrame(update);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [variable, data]);


  const handleYearChange = useCallback((next) => {
    setYear((prev) => (typeof next === 'function' ? next(prev) : next));
  }, []);

  const handleSelect = useCallback((name) => {
    if (compareMode) {
      if (name !== selected) setCompareCountry(name);
      setCompareMode(false);
    } else {
      setSelected(name);
      setCompareCountry(null);
      setCompareMode(false);
    }
  }, [compareMode, selected]);

  const handleSearchSelect = useCallback((name) => {
    setSelected(name);
    setFlyTo(name);
  }, []);

  // Reset compare state whenever the primary country changes
  useEffect(() => {
    setCompareCountry(null);
    setCompareMode(false);
  }, [selected]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (compareMode) { setCompareMode(false); }
        else setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [compareMode]);

  if (error) {
    return (
      <div className="fatal">
        <p>Could not load data. Make sure the files exist in <code>/public/data</code>.</p>
      </div>
    );
  }

  const mobileBg = dark ? '#0d101c' : '#f8f9fc';

  return (
    <div className="app">
      {showLanding && <Landing onEnter={() => setShowLanding(false)} />}
      {showResults && <Results onClose={() => setShowResults(false)} data={data} />}
      <div className="dot-field-wrapper">
        {dark ? (
          <Galaxy
            mouseInteraction={false}
            mouseRepulsion={false}
            density={1.5}
            glowIntensity={0.15}
            saturation={0.15}
            hueShift={210}
            twinkleIntensity={0.2}
            rotationSpeed={0.003}
            speed={0.12}
            starSpeed={0.12}
            transparent={true}
          />
        ) : (
          <DotField
            dotRadius={1.5}
            dotSpacing={20}
            bulgeStrength={60}
            glowRadius={0}
            sparkle={false}
            waveAmplitude={0}
            gradientFrom="rgba(92, 101, 128, 0.62)"
            gradientTo="rgba(147, 155, 178, 0.45)"
          />
        )}
      </div>

      {loading && (
        <div className="loading">
          <div className="spin" />
        </div>
      )}

      <Header
        variable={variable}
        onVariableChange={setVariable}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
        onResultsClick={() => setShowResults(true)}
        showResults={!showLanding}
        onOpenRankings={() => { setSelected(null); setShowRanking(true); }}
      />

      {data && <Legend domains={data.domains} variable={variable || 'r'} healthMetric={healthMetric} hidden={!variable || !!(isSmallPhone && selected)} />}

      {/* Centered country badge + compare UI — desktop only */}
      {selected && !isMobile && (
        <CompareBar
          selected={selected}
          compareCountry={compareCountry}
          compareMode={compareMode}
          countries={data ? Object.keys(data.lookup) : []}
          onClose={() => setSelected(null)}
          onCloseSelected={() => setSelected(compareCountry)}
          onEnterCompare={() => setCompareMode(true)}
          onCancelCompare={() => setCompareMode(false)}
          onSelectCompare={(name) => { setCompareCountry(name); setCompareMode(false); }}
          onClearCompare={() => setCompareCountry(null)}
        />
      )}

      {/* Mobile: keep the original top-right badge */}
      {selected && !isSmallPhone && isMobile && (
        <div className="country-badge">
          <div className="country-badge-label">Selected territory</div>
          {selected}
        </div>
      )}

      {data && geo && (
        <Globe
          data={data}
          geo={geo}
          year={year}
          variable={variable}
          healthMetric={healthMetric}
          selected={selected}
          compareCountry={compareCountry}
          onSelect={handleSelect}
          zoomMult={selected ? 1 : (showRanking ? 1.12 : 0.95)}
          flyTo={flyTo}
          paused={isMobile && !!selected}
        />
      )}

      {/* Search + mode tabs — shown when no country is selected */}
      <AnimatePresence>
        {data && !selected && (
          <OverviewBar
            key="overview-bar"
            countries={Object.keys(data.lookup)}
            onSelect={handleSearchSelect}
            showRanking={showRanking}
            onToggleRanking={() => setShowRanking(r => !r)}
          />
        )}
      </AnimatePresence>

      {/* Ranking panel — visible when Rankings tab is active and no country selected.
          On mobile it opens straight into the full-screen modal (see RankingPanel). */}
      {data && (
        <RankingPanel
          lookup={data.lookup}
          year={year}
          dark={dark}
          visible={!selected && showRanking}
          onSelect={handleSearchSelect}
          mobileMode={isMobile}
          onClose={() => setShowRanking(false)}
        />
      )}

      {data && !isMobile && (
        <div className={`left-light-panel${selected ? ' visible' : ''}`}>
          <RadianceGrowthPanel lookup={data.lookup} country={selected} compareCountry={compareCountry} year={year} dark={dark} inStack={true} />
        </div>
      )}

      {data && (() => {
        const sharedMob = { lookup: data.lookup, country: selected, compareCountry, year, dark, healthMetric, inStack: true, compact: true, bgColor: mobileBg };
        const mobileCards = [
          <RadianceGrowthPanel        key="lgi"        {...sharedMob} />,
          <RadianceGDPPanel       key="left"       {...sharedMob} />,
          <LightGDPRatioPanel        key="lgr"        {...sharedMob} />,
          <HealthTrendPanel key="trajectory" {...sharedMob} />,
          <QuadrantPanel   key="quadrant"   {...sharedMob} />,
          <EnergyPanel     key="energy"     {...sharedMob} />,
          <IncomeGroupPanel key="income"    {...sharedMob} />,
        ];

        return isMobile ? (
          selected && mobileCards.length > 0 && (
            <MobilePanelCarousel
              key={`mob-${selected}-${variable}`}
              cards={mobileCards}
              onClose={() => setSelected(null)}
              footer={
                <CompareBar
                  compact
                  selected={selected}
                  compareCountry={compareCountry}
                  compareMode={compareMode}
                  countries={Object.keys(data.lookup)}
                  onEnterCompare={() => setCompareMode(true)}
                  onCancelCompare={() => setCompareMode(false)}
                  onSelectCompare={(name) => { setCompareCountry(name); setCompareMode(false); }}
                  onClearCompare={() => setCompareCountry(null)}
                />
              }
            />
          )
        ) : (
          <RightPanel
            lookup={data.lookup}
            country={selected}
            compareCountry={compareCountry}
            year={year}
            dark={dark}
            healthMetric={healthMetric}
          />
        );
      })()}


      <Timeline
        year={year}
        onYearChange={handleYearChange}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
      />

    </div>
  );
}
