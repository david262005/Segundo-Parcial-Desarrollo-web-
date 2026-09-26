import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { subscribeMisPujas, subscribeOfertas } from '../services/bids';
import { formatQ } from '../utils/format';

/**
 * Notificación global: si el usuario iba ganando una subasta y otro usuario lo supera,
 * se muestra un aviso en cualquier página donde se encuentre.
 */
export default function OutbidWatcher() {
  const { user } = useAuth();
  const toast = useToast();
  const [misPujas, setMisPujas] = useState({});
  const [ofertas, setOfertas] = useState({});
  const winning = useRef({});

  useEffect(() => {
    if (!user) {
      setMisPujas({});
      winning.current = {};
      return undefined;
    }
    const u1 = subscribeMisPujas(user.uid, setMisPujas);
    const u2 = subscribeOfertas(setOfertas);
    return () => {
      u1();
      u2();
    };
  }, [user]);

  useEffect(() => {
    Object.entries(misPujas).forEach(([vid, monto]) => {
      const oferta = ofertas[vid];
      if (!oferta) return;
      const isWinning = oferta.monto === monto;
      if (winning.current[vid] === true && !isWinning) {
        toast(`⚠ Tu oferta de ${formatQ(monto)} fue superada (nueva oferta: ${formatQ(oferta.monto)}). ¡Haz tu oferta antes de que termine el tiempo!`, 'warning', 8000);
      }
      winning.current[vid] = isWinning;
    });
  }, [misPujas, ofertas, toast]);

  return null;
}
