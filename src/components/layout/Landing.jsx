import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './Landing.css';

const SLIDES = [
  {
    title: 'Once upon a time...\n the Night',
    body: 'Explore the relationship between artificial light pollution, economic development, and mental health across a decade of global data.',
    big: true,
  },
  {
    eyebrow: 'The Globe',
    title: 'An Interactive Map',
    body: 'Drag to rotate, scroll to zoom, and click any country to select it. Switch between Radiance, GDP, and mental health in the header — each metric recolours the globe instantly.',
    icon: 'globe',
  },
  {
    eyebrow: 'Country Panels',
    title: 'Dive Into the Data',
    body: 'Click any country to open a set of charts covering its light pollution trends, economic context, health correlations, and how it compares to the rest of the world.',
    icon: 'chart',
  },
  {
    eyebrow: 'Compare Mode',
    title: 'Country vs. Country',
    body: 'Use the Compare button in the search bar to pick a second country. All panels update to show both countries side by side with colour-coded values and highlighted dots.',
    icon: 'compare',
  },
  {
    eyebrow: 'Timeline & Results',
    title: 'Play & Discover',
    body: 'Scrub the timeline to animate the globe across 2013–2023. When you\'re ready, open Key Findings in the header for a summary of the main patterns across all countries.',
    icon: 'timeline',
  },
];

const ICONS = {
  globe: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="3.5" ry="9" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </svg>
  ),
  chart: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="14" width="4" height="7" rx="1" />
      <rect x="10" y="9" width="4" height="12" rx="1" />
      <rect x="17" y="4" width="4" height="17" rx="1" />
    </svg>
  ),
  health: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21" />
      <line x1="3" y1="4" x2="3" y2="21" />
      <polyline points="6 14 10 9 14 13 19 6" />
      <circle cx="10" cy="9" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <line x1="3" y1="12" x2="21" y2="12" strokeWidth="0.6" strokeDasharray="2,2" />
    </svg>
  ),
  compare: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="12" r="5.5" />
      <circle cx="16" cy="12" r="5.5" />
      <line x1="12" y1="7.5" x2="12" y2="16.5" strokeDasharray="2,2" strokeWidth="0.9" />
    </svg>
  ),
  timeline: (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 8 8 11.5 3 15" fill="currentColor" stroke="none" />
      <line x1="11" y1="11.5" x2="21" y2="11.5" />
      <line x1="11" y1="11.5" x2="16" y2="11.5" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="11.5" r="2.2" fill="currentColor" stroke="none" />
      <line x1="11" y1="14" x2="11" y2="15.5" strokeWidth="1" />
      <line x1="14" y1="14" x2="14" y2="15.5" strokeWidth="1" />
      <line x1="17" y1="14" x2="17" y2="15.5" strokeWidth="1" />
      <line x1="21" y1="14" x2="21" y2="15.5" strokeWidth="1" />
    </svg>
  ),
};

const slideVariants = {
  enter: (dir) => ({ y: dir > 0 ? 56 : -56, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir) => ({ y: dir > 0 ? -56 : 56, opacity: 0 }),
};

const transition = { duration: 0.36, ease: [0.4, 0, 0.2, 1] };

export default function Landing({ onEnter }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [leaving, setLeaving] = useState(false);

  const total = SLIDES.length;
  const isLast = current === total - 1;

  const goTo = useCallback((idx) => {
    if (idx === current || leaving || idx < 0 || idx >= total) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current, leaving, total]);

  const advance = useCallback(() => {
    if (leaving) return;
    if (isLast) {
      setLeaving(true);
      setTimeout(onEnter, 750);
    } else {
      goTo(current + 1);
    }
  }, [current, isLast, leaving, goTo, onEnter]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') advance();
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goTo(current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, goTo, current]);

  const goToRef = useRef(goTo);
  goToRef.current = goTo;
  const currentRef = useRef(current);
  currentRef.current = current;
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const wheelCooldown = useRef(false);

  useEffect(() => {
    const onWheel = (e) => {
      if (wheelCooldown.current) return;
      wheelCooldown.current = true;
      if (e.deltaY > 0) advanceRef.current();
      else if (e.deltaY < 0) goToRef.current(currentRef.current - 1);
      setTimeout(() => { wheelCooldown.current = false; }, 600);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className={`landing${leaving ? ' leaving' : ''}`}>

      <div className="landing-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="landing-slide"
          >
            {slide.icon && (
              <div className="landing-icon">{ICONS[slide.icon]}</div>
            )}
            {slide.eyebrow && <p className="landing-eyebrow">{slide.eyebrow}</p>}
            <h1 className={`landing-title${slide.big ? ' big' : ''}`}>{slide.title}</h1>
            {slide.body && <p className="landing-desc">{slide.body}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="landing-arrow-btn" onClick={advance} aria-label={isLast ? 'Enter site' : 'Next slide'}>
        <svg
          className="landing-arrow"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <nav className="landing-dots" aria-label="Carousel navigation">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`landing-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1} of ${total}`}
          />
        ))}
      </nav>

    </div>
  );
}
