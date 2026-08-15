import { useState, useEffect, useCallback, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import DepthCarousel from '../ui/DepthCarousel.jsx';

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
          <DepthCarousel
            items={items}
            cardWidth={300}
            cardHeight={560}
            radius={22}
            depth={90}
            spread={95}
            tilt={18}
            perspective={1100}
            visibleCards={1.3}
            falloff={0.12}
            blur={1}
            duration={450}
            loop
            showControls={false}
            showIndicators={false}
          />
        </div>
        {footer && <div className="mobile-panel-compare-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
