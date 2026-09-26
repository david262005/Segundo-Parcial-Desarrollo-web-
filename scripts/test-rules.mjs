// Pruebas de las reglas del servidor (database.rules.json) contra el emulador de Firebase.
// Uso: npm run test:rules
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, get, set, update, serverTimestamp } from 'firebase/database';

const app = initializeApp({ apiKey: 'demo', projectId: 'demo-subastas', databaseURL: 'https://demo-subastas-default-rtdb.firebaseio.com' });
const auth = getAuth(app);
const db = getDatabase(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectDatabaseEmulator(db, '127.0.0.1', 9000);

let passed = 0;
let failed = 0;
async function expect(name, shouldPass, fn) {
  let ok;
  try {
    await fn();
    ok = true;
  } catch {
    ok = false;
  }
  if (ok === shouldPass) {
    passed++;
    console.log(`  ✔ ${name}`);
  } else {
    failed++;
    console.log(`  ✖ ${name} (esperado: ${shouldPass ? 'permitido' : 'denegado'})`);
  }
}

const users = {};
const emails = {};
async function switchTo(name) {
  await signOut(auth);
  return (await signInWithEmailAndPassword(auth, emails[name], 'Test#12345')).user;
}
async function createUser(name) {
  await signOut(auth);
  emails[name] = `${name}-${Date.now()}@test.gt`;
  const cred = await createUserWithEmailAndPassword(auth, emails[name], 'Test#12345');
  users[name] = cred.user.uid;
}

const fotos = (n) => Array.from({ length: n }, (_, i) => `data:image/svg+xml,foto${i}`);
const vehicle = (uid, extra = {}) => ({
  ownerId: uid, anio: 2019, tipo: 'Automóvil', marca: 'Toyota', modelo: 'Corolla', motor: '1.8L', transmision: 'CVT',
  combustible: 'Gasolina', traccion: 'FWD', cilindros: 4, dano: 'verde', precioBase: 20000,
  inicio: Date.now() - 3600000, cierre: Date.now() + 3600000, portada: 'data:x', fotosCount: 5, ...extra,
});
const bid = (uid, vid, monto, cantidad, ganador = uid) =>
  update(ref(db), {
    [`ofertas/${vid}`]: { monto, fecha: serverTimestamp(), cantidad },
    [`ganadores/${vid}`]: ganador,
    [`misPujas/${uid}/${vid}`]: monto,
  });

async function main() {
  await createUser('ana');
  await createUser('bruno');
  await createUser('carla');
  const { ana, bruno, carla } = users;

  console.log('Autenticación y publicación');
  await signOut(auth);
  await expect('Anónimo puede leer inventario', true, () => get(ref(db, 'vehicles')));
  await expect('Anónimo NO puede publicar', false, () => update(ref(db), { 'vehicles/v0': vehicle('x'), 'fotos/v0': fotos(5) }));

  await switchTo('ana');
  await expect('Ana publica con 5 fotos', true, () => update(ref(db), { 'vehicles/v1': vehicle(ana), 'fotos/v1': fotos(5) }));
  await expect('Publicar con 4 fotos es rechazado', false, () => update(ref(db), { 'vehicles/v2': vehicle(ana), 'fotos/v2': fotos(4) }));
  await expect('Daño inválido es rechazado', false, () => update(ref(db), { 'vehicles/v3': vehicle(ana, { dano: 'azul' }), 'fotos/v3': fotos(5) }));
  await expect('Cierre antes del inicio es rechazado', false, () => update(ref(db), { 'vehicles/v4': vehicle(ana, { cierre: Date.now() - 7200000 }), 'fotos/v4': fotos(5) }));
  await expect('Publicar a nombre de otro es rechazado', false, () => update(ref(db), { 'vehicles/v5': vehicle(bruno), 'fotos/v5': fotos(5) }));
  await expect('Subasta cerrada (v6)', true, () => update(ref(db), { 'vehicles/v6': vehicle(ana, { inicio: Date.now() - 7200000, cierre: Date.now() - 3600000 }), 'fotos/v6': fotos(5) }));
  await expect('Subasta futura (v7)', true, () => update(ref(db), { 'vehicles/v7': vehicle(ana, { inicio: Date.now() + 3600000, cierre: Date.now() + 7200000 }), 'fotos/v7': fotos(5) }));
  await expect('Ana NO puede ofertar en su propio vehículo', false, () => bid(ana, 'v1', 25000, 1));

  console.log('Reglas de puja');
  await switchTo('bruno');
  await expect('Bruno NO puede editar vehículo de Ana', false, () => set(ref(db, 'vehicles/v1'), vehicle(bruno)));
  await expect('Oferta menor al precio base es rechazada', false, () => bid(bruno, 'v1', 19999, 1));
  await expect('Oferta igual al precio base es aceptada', true, () => bid(bruno, 'v1', 20000, 1));
  await expect('Oferta en subasta cerrada es rechazada', false, () => bid(bruno, 'v6', 70000, 1));
  await expect('Oferta en subasta no iniciada es rechazada', false, () => bid(bruno, 'v7', 70000, 1));

  await switchTo('carla');
  await expect('Oferta igual a la actual es rechazada', false, () => bid(carla, 'v1', 20000, 2));
  await expect('Incremento menor al 10 % es rechazado', false, () => bid(carla, 'v1', 21999, 2));
  await expect('Contador desactualizado (concurrencia) es rechazado', false, () => bid(carla, 'v1', 22000, 1));
  await expect('Suplantar ganador es rechazado', false, () => bid(carla, 'v1', 22000, 2, bruno));
  await expect('Incremento exacto del 10 % es aceptado', true, () => bid(carla, 'v1', 22000, 2));
  await expect('Carla NO puede leer quién ganó (/ganadores)', false, () => get(ref(db, 'ganadores/v1')));
  await expect('Carla NO puede leer pujas de Bruno', false, () => get(ref(db, `misPujas/${bruno}`)));
  await expect('Carla puede leer sus pujas', true, () => get(ref(db, `misPujas/${carla}`)));
  await expect('No se puede borrar la oferta', false, () => set(ref(db, 'ofertas/v1'), null));
  await expect('No se puede escribir ganador sin ofertar', false, () => set(ref(db, 'ganadores/v1'), carla));
  const oferta = (await get(ref(db, 'ofertas/v1'))).val();
  await expect('La oferta pública no expone al ofertante', true, async () => {
    if (Object.keys(oferta).sort().join() !== 'cantidad,fecha,monto') throw new Error();
  });

  console.log('Edición');
  await switchTo('ana');
  await expect('Ana edita el modelo de su vehículo', true, async () => {
    const v = (await get(ref(db, 'vehicles/v1'))).val();
    await set(ref(db, 'vehicles/v1'), { ...v, modelo: 'Corolla LE' });
  });
  await expect('Con pujas, NO puede cambiar el precio base', false, async () => {
    const v = (await get(ref(db, 'vehicles/v1'))).val();
    await set(ref(db, 'vehicles/v1'), { ...v, precioBase: 10000 });
  });

  console.log(`\n${passed} pruebas correctas, ${failed} fallidas`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
