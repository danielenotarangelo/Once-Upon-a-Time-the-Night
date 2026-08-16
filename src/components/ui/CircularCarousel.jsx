import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import './CircularCarousel.css';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Settling after a swipe is a spring rather than a fixed curve — it starts from whatever
// speed the finger left behind instead of restarting the motion from zero.
const SETTLE = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 };

// `progress` is the swipe in flight, measured in card steps: 0 when settled, 1 once the
// finger has dragged a full step towards the next card. Feeding it into the arc as a
// fractional offset is what makes the cards travel with the finger instead of holding
// still and then jumping on release.
function getItemPosition(index, activeIndex, total, { visibleCount, radiusX, radiusY, renderWindow, progress }) {
  const half = Math.floor(visibleCount / 2);
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;

  // Each rendered item is a full chart panel (D3 + effects) — mount only what's needed for
  // the current view plus a small buffer for a smooth transition, not everything the arc
  // formula would technically still place on-stage. Culling on the settled offset rather
  // than the dragged one keeps the mounted set fixed for the whole gesture, so no heavy
  // panel ever mounts mid-swipe.
  if (Math.abs(offset) > renderWindow) return null;

  const shifted = offset - progress;
  const angle = (shifted / visibleCount) * Math.PI;
  const x = Math.sin(angle) * radiusX;
  const y = -Math.cos(angle) * radiusY + radiusY;

  const distance = Math.abs(shifted);
  const maxDistance = half + 1;
  const scale = Math.max(0, 1 - (distance / maxDistance) * 0.3);
  const opacity = Math.max(0, 1 - (distance / maxDistance) * 0.85);
  // Integer, and applied as a plain style rather than an animated value: the incoming card
  // has to take the front the moment it passes the outgoing one, not fade through it.
  const zIndex = Math.round(visibleCount - distance);

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
  // Finger travel that equals one full card step, and the fraction of it that commits
  // the swipe on release.
  dragStep = cardWidth * 0.55,
  commitAt = 0.3,
  onChange,
  className = '',
}) {
  const { t } = useTranslation();
  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef(null);
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

  const onPointerDown = useCallback(e => {
    if (total < 2) return;
    dragRef.current = {
      x: e.clientX, y: e.clientY,
      lastX: e.clientX, lastY: e.clientY,
      lastT: e.timeStamp, velocity: 0,
      moved: false, vertical: false, id: e.pointerId,
    };
  }, [total]);

  const onPointerMove = useCallback(e => {
    const drag = dragRef.current;
    if (!drag || drag.vertical) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    if (!drag.moved) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        drag.vertical = true;
        return;
      }
      if (Math.abs(dx) > 4) {
        drag.moved = true;
        rootRef.current?.setPointerCapture(drag.id);
        setDragging(true);
      }
    }
    // Signed px/ms, exponentially smoothed so a single jittery sample just before lift-off
    // can't read as a flick.
    const dt = e.timeStamp - drag.lastT;
    if (dt > 0) drag.velocity = drag.velocity * 0.4 + ((e.clientX - drag.lastX) / dt) * 0.6;

    // Track the last known-good position ourselves — pointerup/pointercancel don't reliably
    // carry the true final coordinates (pointercancel in particular, e.g. when an OS-level
    // edge-swipe gesture preempts the touch), which was making one swipe direction unreliable.
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.lastT = e.timeStamp;

    // Only ±1 is mounted, so the swipe can carry the cards at most one step out.
    if (drag.moved) setProgress(clamp(-dx / dragStep, -1, 1));
  }, [dragStep]);

  const onPointerEnd = useCallback(e => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(false);
    if (!drag.moved) return;

    const endX = e.type === 'pointercancel' ? drag.lastX : (e.clientX || drag.lastX);
    const dx = endX - drag.x;
    const swiped = clamp(-dx / dragStep, -1, 1);
    // A quick flick counts even when it never travelled far.
    const flick = Math.abs(drag.velocity) > 0.45 && Math.abs(dx) > 12;
    const forward = flick ? drag.velocity < 0 : swiped > 0;

    if (flick || Math.abs(swiped) > commitAt) {
      if (forward) next(); else prev();
    }
    // Cleared in the same batch as the index change, so the spring picks the cards up
    // wherever the finger left them and carries them to their settled slots.
    setProgress(0);
  }, [dragStep, commitAt, next, prev]);

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
      aria-label={t('common.countryCarousel')}
      aria-roledescription="carousel"
      className={`circular-carousel ${className}`.trim()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <AnimatePresence initial={false}>
        {items.map((item, i) => {
          const pos = getItemPosition(i, activeIndex, total, { visibleCount, radiusX, radiusY, renderWindow, progress });
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
              }}
              exit={{ opacity: 0, scale: pos.scale * 0.92, transition: { duration: duration * 0.6, ease } }}
              // Under the finger the cards are positioned outright, so they stay glued to
              // the gesture; once it ends a spring carries them the rest of the way.
              transition={dragging ? { duration: 0 } : SETTLE}
              onClick={() => !isActive && goTo(i)}
              aria-label={t('common.slideOf', { current: i + 1, total })}
              aria-hidden={!isActive}
              className="circular-carousel__card"
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: radius,
                zIndex: pos.zIndex,
                pointerEvents: isActive && !dragging ? 'auto' : 'none',
              }}
            >
              <div className="circular-carousel__content">{item}</div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
