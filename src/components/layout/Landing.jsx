import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import './Landing.css';

// Copy lives in the locale files under landing.slides.<id>
const SLIDES = [
  { id: 'intro',    big: true          },
  { id: 'globe',    icon: 'globe'      },
  { id: 'panels',   icon: 'chart'      },
  { id: 'compare',  icon: 'compare'    },
  { id: 'timeline', icon: 'timeline'   },
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
  const { t } = useTranslation();
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
      if (Math.abs(e.deltaY) < 20) return;
      wheelCooldown.current = true;
      if (e.deltaY > 0) advanceRef.current();
      else if (e.deltaY < 0) goToRef.current(currentRef.current - 1);
      setTimeout(() => { wheelCooldown.current = false; }, 1000);
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  const touchStartY = useRef(null);

  useEffect(() => {
    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchEnd = (e) => {
      if (touchStartY.current === null || wheelCooldown.current) return;
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      touchStartY.current = null;
      if (Math.abs(deltaY) < 50) return;
      wheelCooldown.current = true;
      if (deltaY > 0) advanceRef.current();
      else goToRef.current(currentRef.current - 1);
      setTimeout(() => { wheelCooldown.current = false; }, 1000);
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const slide = SLIDES[current];
  const base  = `landing.slides.${slide.id}`;
  const eyebrow = t(`${base}.eyebrow`, { defaultValue: '' });
  const body    = t(`${base}.body`,    { defaultValue: '' });

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
            {eyebrow && <p className="landing-eyebrow">{eyebrow}</p>}
            <h1 className={`landing-title${slide.big ? ' big' : ''}`}>{t(`${base}.title`)}</h1>
            {body && <p className="landing-desc">{body}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      <button className="landing-arrow-btn" onClick={advance} aria-label={isLast ? t('landing.enterSite') : t('landing.nextSlide')}>
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

      <nav className="landing-dots" aria-label={t('landing.carouselNav')}>
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            className={`landing-dot${i === current ? ' active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={t('common.slideOf', { current: i + 1, total })}
          />
        ))}
      </nav>

    </div>
  );
}
