import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
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
      }
    }
    // Track the last known-good position ourselves — pointerup/pointercancel don't reliably
    // carry the true final coordinates (pointercancel in particular, e.g. when an OS-level
    // edge-swipe gesture preempts the touch), which was making one swipe direction unreliable.
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
  }, []);

  const onPointerEnd = useCallback(e => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (!drag.moved) return;
    const endX = e.type === 'pointercancel' ? drag.lastX : (e.clientX || drag.lastX);
    const dx = endX - drag.x;
    if (Math.abs(dx) < 45) return;
    if (dx < 0) next(); else prev();
  }, [next, prev]);

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
              aria-label={t('common.slideOf', { current: i + 1, total })}
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
    </div>
  );
}
