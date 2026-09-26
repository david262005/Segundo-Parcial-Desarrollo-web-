import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

// Diferencia entre el reloj local y el del servidor, para que todos los usuarios
// vean el mismo temporizador aunque su computadora tenga la hora desfasada.
let offset = 0;
let subscribed = false;

function ensureOffset() {
  if (subscribed) return;
  subscribed = true;
  onValue(ref(db, '.info/serverTimeOffset'), (s) => {
    offset = s.val() || 0;
  });
}

export function serverNow() {
  ensureOffset();
  return Date.now() + offset;
}

/** Hora del servidor que se actualiza cada `intervalMs`. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
