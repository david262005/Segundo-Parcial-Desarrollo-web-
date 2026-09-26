// Crea los usuarios de prueba, los catálogos y vehículos de ejemplo en Firebase.
// Uso: npm run seed   (requiere el archivo .env con la configuración de Firebase)
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { getDatabase, ref, get, set, update, push, serverTimestamp } from 'firebase/database';
import { DEFAULT_CATALOGS } from '../src/data/catalogs.js';

const env = process.env;
if (!env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_DATABASE_URL) {
  console.error('Falta el archivo .env con la configuración de Firebase (ver .env.example).');
  process.exit(1);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const auth = getAuth(app);
const db = getDatabase(app);

export const USERS = [
  { nombre: 'Ana', apellido: 'López', email: 'ana.lopez@subastaauto.gt', telefono: '5555 1001', password: 'Subasta#2026A' },
  { nombre: 'Bruno', apellido: 'Méndez', email: 'bruno.mendez@subastaauto.gt', telefono: '5555 1002', password: 'Subasta#2026B' },
  { nombre: 'Carla', apellido: 'Ruiz', email: 'carla.ruiz@subastaauto.gt', telefono: '5555 1003', password: 'Subasta#2026C' },
];

// ---------- Imágenes de ejemplo (SVG generado, sin depender de internet) ----------
const VIEWS = ['Vista lateral', 'Vista frontal', 'Vista trasera', 'Interior', 'Motor', 'Detalle de daño'];

function carSvg(color, title, view, dano) {
  const bg = ['#e8f0ff', '#fff6dc', '#e9f8ef', '#f3ecff', '#e6f6fb', '#fdecec'][VIEWS.indexOf(view)];
  const damage =
    view === 'Detalle de daño'
      ? `<g stroke="${dano === 'rojo' ? '#e5484d' : dano === 'amarillo' ? '#d49b00' : '#22a45d'}" stroke-width="7" stroke-linecap="round" fill="none">
          <path d="M300 250 l40 25 l-20 20 l45 22"/><path d="M420 240 l30 30 l-25 10 l35 30"/></g>`
      : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 800 533">
  <rect width="800" height="533" fill="${bg}"/>
  <rect y="400" width="800" height="133" fill="#dfe6f2"/>
  <g transform="translate(90 150)">
    <path d="M40 230 L60 160 Q70 140 100 136 L190 128 L260 70 Q280 55 310 55 L450 55 Q480 55 500 72 L570 128 L610 136 Q640 142 650 170 L660 230 Z" fill="${color}"/>
    <path d="M275 80 L310 70 L420 70 L420 128 L220 128 Z" fill="#dff1ff" opacity="0.95"/>
    <path d="M435 70 L470 72 L540 128 L435 128 Z" fill="#dff1ff" opacity="0.95"/>
    <rect x="40" y="200" width="620" height="30" rx="10" fill="${color}" opacity="0.85"/>
    <circle cx="170" cy="235" r="52" fill="#4b5563"/><circle cx="170" cy="235" r="24" fill="#cbd5e1"/>
    <circle cx="530" cy="235" r="52" fill="#4b5563"/><circle cx="530" cy="235" r="24" fill="#cbd5e1"/>
    <rect x="620" y="160" width="30" height="16" rx="4" fill="#ffe08a"/>
  </g>
  ${damage}
  <text x="40" y="70" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#24324a">${title}</text>
  <text x="40" y="110" font-family="Arial, sans-serif" font-size="24" fill="#6b7a93">${view} · Foto de ejemplo</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const H = 3600 * 1000;
const D = 24 * H;

// owner = índice del usuario que publica
const SAMPLE_VEHICLES = [
  { owner: 0, anio: 2019, tipo: 'Automóvil', marca: 'Toyota', modelo: 'Corolla LE', motor: '1.8L I4', transmision: 'CVT', combustible: 'Gasolina', traccion: 'FWD', cilindros: 4, dano: 'verde', precioBase: 20000, inicio: -H, cierre: 21 * D, color: '#3b82f6', descripcion: 'Golpe leve en defensa trasera. Arranca y camina. Llaves disponibles.' },
  { owner: 0, anio: 2021, tipo: 'SUV', marca: 'Honda', modelo: 'CR-V EX', motor: '1.5L Turbo I4', transmision: 'CVT', combustible: 'Gasolina', traccion: 'AWD', cilindros: 4, dano: 'amarillo', precioBase: 55000, inicio: -H, cierre: 10 * D, color: '#94a3b8', descripcion: 'Daño frontal, bolsas de aire intactas.' },
  { owner: 1, anio: 2018, tipo: 'Pickup', marca: 'Ford', modelo: 'F-150 XLT', motor: '5.0L V8', transmision: 'Automática', combustible: 'Gasolina', traccion: '4WD', cilindros: 8, dano: 'rojo', precioBase: 40000, inicio: -H, cierre: 25 * D, color: '#ef4444', descripcion: 'Salvamento por volcadura. Motor en buen estado.' },
  { owner: 1, anio: 2022, tipo: 'Automóvil', marca: 'Tesla', modelo: 'Model 3', motor: 'Eléctrico dual', transmision: 'Automática', combustible: 'Eléctrico', traccion: 'AWD', cilindros: 0, dano: 'amarillo', precioBase: 120000, inicio: -H, cierre: 14 * D, color: '#f8fafc', descripcion: 'Daño lateral derecho. Batería al 80 %.' },
  { owner: 2, anio: 2017, tipo: 'Automóvil', marca: 'BMW', modelo: '330i', motor: '2.0L Turbo I4', transmision: 'Automática', combustible: 'Gasolina', traccion: 'RWD', cilindros: 4, dano: 'verde', precioBase: 45000, inicio: 2 * H, cierre: 30 * D, color: '#1e40af', descripcion: 'Título limpio, rayones menores.' },
  { owner: 2, anio: 2020, tipo: 'SUV', marca: 'Jeep', modelo: 'Wrangler Sport', motor: '3.6L V6', transmision: 'Manual', combustible: 'Gasolina', traccion: '4WD', cilindros: 6, dano: 'rojo', precioBase: 60000, inicio: -2 * D, cierre: -H, color: '#16a34a', descripcion: 'Inundación. Subasta cerrada sin ofertas (desierta).' },
  { owner: 0, anio: 2016, tipo: 'Pickup', marca: 'Toyota', modelo: 'Hilux SR', motor: '2.4L Diésel I4', transmision: 'Manual', combustible: 'Diésel', traccion: '4WD', cilindros: 4, dano: 'verde', precioBase: 85000, inicio: -H, cierre: 28 * D, color: '#e2e8f0', descripcion: 'Uso agrícola, mantenimiento al día.' },
  { owner: 1, anio: 2023, tipo: 'Motocicleta', marca: 'Honda', modelo: 'CB500F', motor: '471cc Paralelo', transmision: 'Manual', combustible: 'Gasolina', traccion: 'RWD', cilindros: 2, dano: 'amarillo', precioBase: 18000, inicio: -H, cierre: 7 * D, color: '#f97316', descripcion: 'Caída lateral, carenado dañado.' },
];

async function login(u) {
  try {
    return (await signInWithEmailAndPassword(auth, u.email, u.password)).user;
  } catch {
    const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
    await updateProfile(cred.user, { displayName: `${u.nombre} ${u.apellido}` });
    console.log(`  ✔ Usuario creado: ${u.email}`);
    return cred.user;
  }
}

async function main() {
  console.log('1) Usuarios de prueba');
  const uids = [];
  for (const u of USERS) {
    const user = await login(u);
    await set(ref(db, `users/${user.uid}`), {
      nombre: u.nombre,
      apellido: u.apellido,
      email: user.email,
      telefono: u.telefono,
      createdAt: serverTimestamp(),
    });
    uids.push(user.uid);
    console.log(`  ✔ ${u.email}`);
  }

  console.log('2) Catálogos');
  const catSnap = await get(ref(db, 'catalogs'));
  if (!catSnap.exists()) {
    await set(ref(db, 'catalogs'), DEFAULT_CATALOGS);
    console.log('  ✔ Catálogos creados');
  } else console.log('  · Ya existían');

  console.log('3) Vehículos de ejemplo');
  const existing = (await get(ref(db, 'vehicles'))).val() || {};
  if (Object.keys(existing).length) {
    console.log('  · Ya existen vehículos, no se crean ejemplos');
  } else {
    const now = Date.now();
    const ids = [];
    for (const v of SAMPLE_VEHICLES) {
      await signOut(auth);
      const owner = await login(USERS[v.owner]);
      const title = `${v.anio} ${v.marca} ${v.modelo}`;
      const fotos = VIEWS.map((view) => carSvg(v.color, title, view, v.dano));
      const id = push(ref(db, 'vehicles')).key;
      const { owner: _o, color: _c, inicio, cierre, ...data } = v;
      await update(ref(db), {
        [`vehicles/${id}`]: {
          ...data,
          ownerId: owner.uid,
          inicio: now + inicio,
          cierre: now + cierre,
          portada: fotos[0],
          fotosCount: fotos.length,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        [`fotos/${id}`]: fotos,
      });
      ids.push({ id, ...v });
      console.log(`  ✔ ${title}`);
    }

    console.log('4) Pujas de ejemplo');
    const bid = async (userIdx, veh, monto, cantidad) => {
      await signOut(auth);
      const u = await login(USERS[userIdx]);
      await update(ref(db), {
        [`ofertas/${veh.id}`]: { monto, fecha: serverTimestamp(), cantidad },
        [`ganadores/${veh.id}`]: u.uid,
        [`misPujas/${u.uid}/${veh.id}`]: monto,
      });
      console.log(`  ✔ ${USERS[userIdx].nombre} ofertó Q${monto} por ${veh.marca} ${veh.modelo}`);
    };
    await bid(1, ids[0], 20000, 1); // Bruno en Corolla de Ana
    await bid(2, ids[0], 22000, 2); // Carla supera (+10 %)
    await bid(2, ids[2], 42000, 1); // Carla en F-150 de Bruno
  }

  await signOut(auth);
  console.log('\nListo. Usuarios de prueba:');
  USERS.forEach((u) => console.log(`  ${u.email}  /  ${u.password}`));
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.code || '', err.message);
  process.exit(1);
});
