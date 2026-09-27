// Reemplaza las fotos de ejemplo de los vehículos del seed por fotografías reales
// de Wikimedia Commons (licencias libres). Uso: npm run fotos  (añadir --dry para solo listar)
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, ref, get, update } from 'firebase/database';
import { USERS } from './users.mjs';

const DRY = process.argv.includes('--dry');
// --solo=Corolla vuelve a descargar las fotos de ese vehículo aunque ya tenga fotos reales
const SOLO = process.argv.find((a) => a.startsWith('--solo='))?.slice(7);
const UA = { 'User-Agent': 'SubastaAutoGT/1.0 (proyecto universitario)' };
const FOTOS_POR_VEHICULO = 6;

// "marca modelo" -> búsqueda en Commons + palabras que deben aparecer en el nombre del archivo
const CATEGORIAS = {
  'Toyota Corolla LE': { q: 'TOYOTA COROLLA SEDAN (E210) China', key: /corolla sedan.*e210/i },
  'Honda CR-V EX': { q: 'Honda CR-V fifth generation', key: /cr-?v/i },
  'Ford F-150 XLT': { q: 'Ford F-150 XLT thirteenth generation', key: /f-?150/i },
  'Tesla Model 3': { q: 'Tesla Model 3 car', key: /model 3/i },
  'BMW 330i': { q: 'BMW 3 Series F30 sedan', key: /330|320|328|f30|3 series|3er|3-series/i },
  'Jeep Wrangler Sport': { q: 'Jeep Wrangler JL', key: /wrangler/i },
  'Toyota Hilux SR': { q: 'Toyota Hilux', key: /hilux.*(2\.4|2\.8|gun1|20(1[6-9]|2[0-4]))|(2\.4|2\.8|gun1|20(1[6-9]|2[0-4])).*hilux/i },
  'Honda CB500F': { q: 'Honda CB500F', key: /cb ?500/i },
};
const EXCLUIR = /\b(sketch|logo|badge|emblem|without|museum|three|toy|model car|lego|wheel|dashboard|engine|seats?|rims?|and|interior|ambulance|army|fire service|security|glass|concept|ora)\b|&/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url) {
  for (let intento = 0; intento < 6; intento++) {
    await sleep(1200);
    const res = await fetch(url, { headers: UA });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      await sleep(4000 * (intento + 1)); // límite de peticiones de Wikimedia
    }
  }
  throw new Error('Wikimedia no respondió');
}

async function toDataUrl(url) {
  for (let intento = 0; intento < 6; intento++) {
    await sleep(800);
    const res = await fetch(url, { headers: UA });
    if (res.ok && (res.headers.get('content-type') || '').startsWith('image/'))
      return `data:image/jpeg;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    await sleep(4000 * (intento + 1));
  }
  throw new Error(`No se pudo descargar ${url}`);
}

async function buscar(nombre) {
  const { q, key } = CATEGORIAS[nombre];
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=50' +
    `&gsrsearch=${encodeURIComponent(`${q} filetype:bitmap`)}&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1024`;
  const data = await api(url);
  const lista = Object.values(data.query?.pages || {})
    .sort((a, b) => a.index - b.index)
    .map((p) => ({ title: p.title, ...(p.imageinfo?.[0] || {}) }))
    .filter((i) => i.mime === 'image/jpeg' && i.width > i.height * 1.2 && i.width >= 800)
    .filter((i) => key.test(i.title) && !EXCLUIR.test(i.title));
  return lista.length >= 5 ? { cat: q, lista: lista.slice(0, FOTOS_POR_VEHICULO) } : null;
}

async function main() {
  if (DRY) {
    for (const nombre of Object.keys(CATEGORIAS)) {
      const r = await buscar(nombre);
      console.log(`${nombre}: ${r ? `${r.lista.length} fotos (${r.cat})` : 'SIN FOTOS SUFICIENTES'}`);
      r?.lista.forEach((f) => console.log(`   ${f.title}`));
    }
    return;
  }

  const app = initializeApp({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
  const auth = getAuth(app);
  const db = getDatabase(app);

  const vehicles = (await get(ref(db, 'vehicles'))).val() || {};
  for (const [id, v] of Object.entries(vehicles)) {
    const nombre = `${v.marca} ${v.modelo}`;
    if (!CATEGORIAS[nombre]) continue;
    if (!v.portada.startsWith('data:image/svg') && !(SOLO && nombre.includes(SOLO))) continue;
    const r = await buscar(nombre);
    if (!r) {
      console.log(`  · ${nombre}: sin fotos suficientes, se deja igual`);
      continue;
    }
    const fotos = [];
    for (const f of r.lista) fotos.push(await toDataUrl(f.thumburl.replace(/\/\d+px-/, '/960px-')));
    const portada = await toDataUrl(r.lista[0].thumburl.replace(/\/\d+px-/, '/500px-'));

    await signOut(auth);
    // El dueño es quien puede modificar su publicación (reglas del servidor)
    for (const u of USERS) {
      const cred = await signInWithEmailAndPassword(auth, u.email, u.password);
      if (cred.user.uid === v.ownerId) break;
    }
    const kb = (s) => Math.round(s.length / 1024);
    console.log(`    portada ${kb(portada)} KB, fotos ${fotos.map(kb).join('/')} KB`);
    await update(ref(db), {
      [`vehicles/${id}/portada`]: portada,
      [`vehicles/${id}/fotosCount`]: fotos.length,
      [`fotos/${id}`]: fotos,
    });
    console.log(`  ✔ ${v.anio} ${nombre}: ${fotos.length} fotos reales (${r.cat})`);
  }
  await signOut(auth);
  process.exit(0);
}

main().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
