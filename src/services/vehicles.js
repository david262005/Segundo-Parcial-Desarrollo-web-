import { ref, onValue, push, update, get, query, orderByChild, equalTo, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';
import { makeThumbnail } from '../utils/images';

const toList = (val) => Object.entries(val || {}).map(([id, v]) => ({ id, ...v }));

/** Inventario global en tiempo real. Devuelve la función para cancelar la suscripción. */
export const subscribeVehicles = (cb) => onValue(ref(db, 'vehicles'), (s) => cb(toList(s.val())));

export const subscribeMyVehicles = (uid, cb) =>
  onValue(query(ref(db, 'vehicles'), orderByChild('ownerId'), equalTo(uid)), (s) => cb(toList(s.val())));

export const subscribeVehicle = (id, cb) =>
  onValue(ref(db, `vehicles/${id}`), (s) => cb(s.exists() ? { id, ...s.val() } : null));

export const subscribeFotos = (id, cb) => onValue(ref(db, `fotos/${id}`), (s) => cb(s.val() || []));

export async function getVehicleWithFotos(id) {
  const [v, f] = await Promise.all([get(ref(db, `vehicles/${id}`)), get(ref(db, `fotos/${id}`))]);
  if (!v.exists()) return null;
  return { vehicle: { id, ...v.val() }, fotos: f.val() || [] };
}

function cleanData(data) {
  return {
    anio: Number(data.anio),
    tipo: data.tipo,
    marca: data.marca,
    modelo: data.modelo.trim(),
    motor: data.motor.trim(),
    transmision: data.transmision,
    combustible: data.combustible,
    traccion: data.traccion,
    cilindros: Number(data.cilindros),
    dano: data.dano,
    precioBase: Math.round(Number(data.precioBase)),
    inicio: data.inicio,
    cierre: data.cierre,
    descripcion: (data.descripcion || '').trim(),
  };
}

/** Publica un vehículo: ficha técnica + fotos se escriben de forma atómica. */
export async function createVehicle(uid, data, fotos) {
  const id = push(ref(db, 'vehicles')).key;
  const portada = await makeThumbnail(fotos[0]);
  await update(ref(db), {
    [`vehicles/${id}`]: {
      ...cleanData(data),
      ownerId: uid,
      portada,
      fotosCount: fotos.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    [`fotos/${id}`]: fotos,
  });
  return id;
}

export async function updateVehicle(uid, original, data, fotos) {
  const portada = await makeThumbnail(fotos[0]);
  await update(ref(db), {
    [`vehicles/${original.id}`]: {
      ...cleanData(data),
      ownerId: uid,
      portada,
      fotosCount: fotos.length,
      createdAt: original.createdAt || Date.now(),
      updatedAt: serverTimestamp(),
    },
    [`fotos/${original.id}`]: fotos,
  });
}
