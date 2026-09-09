'use client';
import { useEffect, useRef, useState } from 'react';

/** Anime un nombre de 0 vers `value` au montage. `format` transforme le nombre courant en texte affiché. */
export default function CountUp({ value = 0, format = (n) => Math.round(n).toLocaleString('fr-FR'), duration = 900, disabled = false }) {
  const [display, setDisplay] = useState(disabled ? value : 0);
  const raf = useRef(null);

  useEffect(() => {
    if (disabled) { setDisplay(value); return; }
    const target = Number(value) || 0;
    const start = performance.now();
    const from = 0;
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (target - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [value, duration, disabled]);

  return <>{format(display)}</>;
}
