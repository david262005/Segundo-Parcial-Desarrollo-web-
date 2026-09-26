import { useEffect, useRef, useState } from 'react';

/** Carrusel interactivo: flechas, miniaturas, puntos, teclado, deslizamiento táctil y pantalla completa. */
export default function Carousel({ images, alt }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touchX = useRef(null);
  const total = images.length;

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [total, index]);

  const go = (i) => setIndex(((i % total) + total) % total);
  const prev = () => go(index - 1);
  const next = () => go(index + 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setZoom(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!total) return <div className="carousel carousel-empty">Sin fotografías</div>;

  const onTouchStart = (e) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
    touchX.current = null;
  };

  return (
    <div className="carousel">
      <div className="carousel-main" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
          {images.map((src, i) => (
            <img key={i} src={src} alt={`${alt} - foto ${i + 1}`} onClick={() => setZoom(true)} draggable="false" />
          ))}
        </div>
        <button className="carousel-btn left" onClick={prev} aria-label="Foto anterior">
          ‹
        </button>
        <button className="carousel-btn right" onClick={next} aria-label="Foto siguiente">
          ›
        </button>
        <span className="carousel-counter">
          {index + 1} / {total}
        </span>
        <button className="carousel-zoom" onClick={() => setZoom(true)} aria-label="Ver en pantalla completa">
          ⤢
        </button>
        <div className="carousel-dots">
          {images.map((_, i) => (
            <button key={i} className={i === index ? 'active' : ''} onClick={() => go(i)} aria-label={`Ir a foto ${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="carousel-thumbs">
        {images.map((src, i) => (
          <button key={i} className={i === index ? 'active' : ''} onClick={() => go(i)}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)}>
          <img src={images[index]} alt={alt} onClick={(e) => e.stopPropagation()} />
          <button className="carousel-btn left" onClick={(e) => (e.stopPropagation(), prev())}>
            ‹
          </button>
          <button className="carousel-btn right" onClick={(e) => (e.stopPropagation(), next())}>
            ›
          </button>
          <button className="lightbox-close" onClick={() => setZoom(false)} aria-label="Cerrar">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
