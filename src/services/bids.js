import { ref, onValue, update, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

/** Oferta más alta de todos los vehículos: { [vehicleId]: { monto, fecha, cantidad } } (sin identidad del ofertante). */
export const subscribeOfertas = (cb) => onValue(ref(db, 'ofertas'), (s) => cb(s.val() || {}));

export const subscribeOferta = (vid, cb) => onValue(ref(db, `ofertas/${vid}`), (s) => cb(s.val()));

/** Mis montos ofertados: { [vehicleId]: monto }. Solo el propio usuario puede leerlos. */
export const subscribeMisPujas = (uid, cb) => onValue(ref(db, `misPujas/${uid}`), (s) => cb(s.val() || {}));

/**
 * Registra una puja. La escritura es atómica y el servidor (reglas de Firebase) valida:
 *  - usuario autenticado y que no sea el dueño
 *  - que la subasta esté dentro de su horario (hora del servidor)
 *  - monto >= precio base y >= oferta actual + 10 %
 *  - que nadie haya ofertado entre medio (control de concurrencia con "cantidad")
 * El uid del ganador se guarda en /ganadores, que nadie puede leer (privacidad).
 */
export async function placeBid(uid, vid, monto, ofertaActual) {
  await update(ref(db), {
    [`ofertas/${vid}`]: {
      monto,
      fecha: serverTimestamp(),
      cantidad: (ofertaActual?.cantidad || 0) + 1,
    },
    [`ganadores/${vid}`]: uid,
    [`misPujas/${uid}/${vid}`]: monto,
  });
}
