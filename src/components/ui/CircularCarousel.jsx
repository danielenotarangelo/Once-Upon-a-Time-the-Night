import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './CircularCarousel.css';

function getItemPosition(index, activeIndex, total, { visibleCount, radiusX, radiusY, renderWindow }) {
  const half = Math.floor(visibleCount / 2);
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;

  // Each rendered item is a full chart panel (D3 + effects) — mount only what's needed for
  // the current view plus a small buffer for a smooth transition, not everything the arc
  // formula would technically still place on-stage.
  if (Math.abs(offset) > renderWindow) return null;

  const angle = (offset / visibleCount) * Math.PI;
  const x = Math.sin(angle) * radiusX;
  const y = -Math.cos(angle) * radiusY + radiusY;

  const distance = Math.abs(offset);
  const maxDistance = half + 1;
  const scale = Math.max(0, 1 - (distance / maxDistance) * 0.3);
  const opacity = Math.max(0, 1 - (distance / maxDistance) * 0.85);
  const zIndex = visibleCount - distance;

  return { x, y, scale, opacity, zIndex, offset };
}

export default function CircularCarousel({
  items = [],
  cardWidth = 300,
  cardHeight = 560,
  radius = 22,
  visibleCount = 5,
  radiusX = 160,
  radiusY = 24,
  renderWindow = 1,
  duration = 0.62,
  ease = [0.22, 1, 0.36, 1],
  onChange,
  className = '',
}) {
  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);

  const goTo = useCallback(
    index => {
      const next = ((index % total) + total) % total;
      setActiveIndex(next);
      onChange?.(next, items[next]);
    },
    [total, items, onChange]
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  // The whole card stack is one draggable "track" — while dragging, Motion moves it 1:1 with
  // the finger (real tracking, not a threshold check after the fact), and on release we work
  // out how many slots that drag crossed and settle there. The track's own x then animates
  // back to 0 in the same transition as the cards re-arranging to the new active index, so the
  // release reads as a continuation of the drag rather than a snap.
  const handleDragEnd = useCallback(
    (_, info) => {
      if (total < 2) return;
      // Distance-only — how far you actually dragged, not a velocity-projected guess. A fast
      // flick and a slow drag of the same length land on the same slot, which reads as more
      // predictable/"it's really following my hand" than fling-based prediction.
      const stepPx = Math.max(cardWidth * 0.55, 90);
      const steps = Math.round(-info.offset.x / stepPx);
      if (steps !== 0) goTo(activeIndex + steps);
    },
    [total, cardWidth, activeIndex, goTo]
  );

  useEffect(() => {
    const handler = e => {
      if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    const el = rootRef.current;
    el?.addEventListener('keydown', handler);
    return () => el?.removeEventListener('keydown', handler);
  }, [next, prev]);

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      role="region"
      aria-label="Country panel carousel"
      aria-roledescription="carousel"
      className={`circular-carousel ${className}`.trim()}
    >
      <motion.div
        className="circular-carousel__track"
        drag={total > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.85}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        dragTransition={{ bounceStiffness: 380, bounceDamping: 32 }}
      >
        <AnimatePresence initial={false}>
          {items.map((item, i) => {
            const pos = getItemPosition(i, activeIndex, total, { visibleCount, radiusX, radiusY, renderWindow });
            if (!pos) return null;
            const isActive = i === activeIndex;
            return (
              <motion.div
                key={i}
                // Entering cards slide in from a touch further out (in the direction they're
                // coming from) instead of just fading in place — reads as continuous motion
                // rather than a pop, especially right at the moment a swipe crosses over.
                initial={{
                  opacity: 0,
                  scale: pos.scale * 0.92,
                  x: pos.x - cardWidth / 2 + (pos.offset > 0 ? 26 : pos.offset < 0 ? -26 : 0),
                  y: pos.y - cardHeight / 2,
                }}
                animate={{
                  x: pos.x - cardWidth / 2,
                  y: pos.y - cardHeight / 2,
                  scale: pos.scale,
                  opacity: pos.opacity,
                  zIndex: pos.zIndex,
                }}
                exit={{ opacity: 0, scale: pos.scale * 0.92 }}
                transition={{ duration, ease }}
                onClick={() => !isActive && goTo(i)}
                aria-label={`Slide ${i + 1} of ${total}`}
                aria-hidden={!isActive}
                className="circular-carousel__card"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  borderRadius: radius,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
              >
                <div className="circular-carousel__content">{item}</div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
