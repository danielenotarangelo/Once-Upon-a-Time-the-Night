import { useState, useEffect, useCallback, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import CircularCarousel from '../ui/CircularCarousel.jsx';

export default function MobilePanelCarousel({ cards, onClose, footer }) {
  const [closing, setClosing] = useState(false);

  const handleClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const t = setTimeout(onClose, 200);
    return () => clearTimeout(t);
  }, [closing, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [handleClose]);

  const items = cards.map(card => cloneElement(card, { onClose: handleClose }));

  return createPortal(
    <div className={`mobile-panel-backdrop${closing ? ' closing' : ''}`} onClick={handleClose}>
      <div className={`mobile-panel-modal${closing ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="mobile-panel-carousel-area">
          <CircularCarousel
            items={items}
            cardWidth={300}
            cardHeight={560}
            radius={22}
            visibleCount={5}
            radiusX={160}
            radiusY={24}
            duration={0.5}
          />
        </div>
        {footer && <div className="mobile-panel-compare-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
