import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeVehicles } from '../services/vehicles';
import { subscribeOfertas, subscribeMisPujas } from '../services/bids';
import { useCatalogs } from '../services/catalogs';
import { useAuth } from '../context/AuthContext';
import { useNow } from '../hooks/useServerTime';
import { auctionStatus } from '../utils/auction';
import VehicleCard from '../components/VehicleCard';
import Spinner from '../components/Spinner';

const EMPTY_FILTERS = {
  q: '',
  tipo: '',
  marca: '',
  modelo: '',
  anioMin: '',
  anioMax: '',
  transmision: '',
  combustible: '',
  traccion: '',
  cilindros: '',
  danos: [],
  estado: '',
  precioMax: '',
  orden: 'cierre',
};

export default function Home() {
  const { user } = useAuth();
  const catalogs = useCatalogs();
  const now = useNow();
  const [vehicles, setVehicles] = useState(null);
  const [ofertas, setOfertas] = useState({});
  const [misPujas, setMisPujas] = useState({});
  const [f, setF] = useState(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const u1 = subscribeVehicles(setVehicles);
    const u2 = subscribeOfertas(setOfertas);
    return () => {
      u1();
      u2();
    };
  }, []);

  useEffect(() => {
    if (!user) return setMisPujas({});
    return subscribeMisPujas(user.uid, setMisPujas);
  }, [user]);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const toggleDano = (d) =>
    setF((p) => ({ ...p, danos: p.danos.includes(d) ? p.danos.filter((x) => x !== d) : [...p.danos, d] }));

  const activeCount = Object.entries(f).filter(([k, v]) => k !== 'orden' && (Array.isArray(v) ? v.length : v)).length;

  const filtered = useMemo(() => {
    if (!vehicles) return [];
    const q = f.q.trim().toLowerCase();
    const modelo = f.modelo.trim().toLowerCase();
    const list = vehicles.filter((v) => {
      const oferta = ofertas[v.id];
      const status = auctionStatus(v, oferta, now);
      const precio = oferta ? oferta.monto : v.precioBase;
      if (q && !`${v.anio} ${v.marca} ${v.modelo} ${v.motor} ${v.tipo}`.toLowerCase().includes(q)) return false;
      if (f.tipo && v.tipo !== f.tipo) return false;
      if (f.marca && v.marca !== f.marca) return false;
      if (modelo && !v.modelo.toLowerCase().includes(modelo)) return false;
      if (f.anioMin && v.anio < Number(f.anioMin)) return false;
      if (f.anioMax && v.anio > Number(f.anioMax)) return false;
      if (f.transmision && v.transmision !== f.transmision) return false;
      if (f.combustible && v.combustible !== f.combustible) return false;
      if (f.traccion && v.traccion !== f.traccion) return false;
      if (f.cilindros !== '' && v.cilindros !== Number(f.cilindros)) return false;
      if (f.danos.length && !f.danos.includes(v.dano)) return false;
      if (f.precioMax && precio > Number(f.precioMax)) return false;
      if (f.estado === 'activa' && status !== 'activa') return false;
      if (f.estado === 'proxima' && status !== 'proxima') return false;
      if (f.estado === 'cerrada' && status !== 'vendida' && status !== 'desierta') return false;
      return true;
    });
    const price = (v) => (ofertas[v.id] ? ofertas[v.id].monto : v.precioBase);
    const closed = (v) => (now >= v.cierre ? 1 : 0);
    const sorters = {
      cierre: (a, b) => closed(a) - closed(b) || a.cierre - b.cierre,
      recientes: (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      precioAsc: (a, b) => price(a) - price(b),
      precioDesc: (a, b) => price(b) - price(a),
      anio: (a, b) => b.anio - a.anio,
    };
    return list.sort(sorters[f.orden]);
  }, [vehicles, ofertas, f, now]);

  const stats = useMemo(() => {
    const all = vehicles || [];
    return {
      total: all.length,
      activas: all.filter((v) => auctionStatus(v, ofertas[v.id], now) === 'activa').length,
      pujas: Object.values(ofertas).reduce((s, o) => s + (o.cantidad || 0), 0),
    };
  }, [vehicles, ofertas, now]);

  return (
    <>
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow">Subastas de vehículos estilo EE. UU.</span>
          <h1>Encuentre, oferte y gane su próximo vehículo en tiempo real</h1>
          <div className="pillars">
            <span>
              <b>1</b> Regístrese
            </span>
            <span>
              <b>2</b> Encuentre
            </span>
            <span>
              <b>3</b> Oferte
            </span>
          </div>
          {!user ? (
            <div className="hero-cta">
              <Link to="/registro" className="btn btn-accent btn-lg">
                Crear cuenta gratis
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Ya tengo cuenta
              </Link>
            </div>
          ) : (
            <div className="hero-cta">
              <Link to="/publicar" className="btn btn-accent btn-lg">
                Publicar un vehículo
              </Link>
            </div>
          )}
        </div>
        <div className="hero-stats">
          <div>
            <strong>{stats.activas}</strong>
            <span>Subastas activas</span>
          </div>
          <div>
            <strong>{stats.total}</strong>
            <span>Vehículos en inventario</span>
          </div>
          <div>
            <strong>{stats.pujas}</strong>
            <span>Pujas realizadas</span>
          </div>
        </div>
      </section>

      {!user && (
        <div className="alert alert-info readonly-note">
          Está viendo el inventario en <b>modo lectura</b>. <Link to="/login">Inicie sesión</Link> o{' '}
          <Link to="/registro">regístrese</Link> para ofertar o publicar vehículos.
        </div>
      )}

      <div className="inventory">
        <aside className={`card filters ${showFilters ? 'open' : ''}`}>
          <div className="filters-head">
            <h2>Filtros</h2>
            {activeCount > 0 && (
              <button className="link-btn" onClick={() => setF(EMPTY_FILTERS)}>
                Limpiar ({activeCount})
              </button>
            )}
          </div>

          <div className="field">
            <label>Búsqueda</label>
            <input value={f.q} onChange={set('q')} placeholder="Marca, modelo, motor…" />
          </div>
          <div className="field">
            <label>Estado de subasta</label>
            <select value={f.estado} onChange={set('estado')}>
              <option value="">Todas</option>
              <option value="activa">En subasta</option>
              <option value="proxima">Próximamente</option>
              <option value="cerrada">Cerradas</option>
            </select>
          </div>
          <div className="field">
            <label>Nivel de daño</label>
            <div className="damage-filter">
              {catalogs.danos.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`damage-chip damage-${d.id} ${f.danos.includes(d.id) ? 'selected' : ''}`}
                  onClick={() => toggleDano(d.id)}
                  title={d.descripcion}
                >
                  <span className="dot" />
                  {d.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Tipo de artículo</label>
            <select value={f.tipo} onChange={set('tipo')}>
              <option value="">Todos</option>
              {catalogs.tipos.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Marca</label>
            <select value={f.marca} onChange={set('marca')}>
              <option value="">Todas</option>
              {catalogs.marcas.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Modelo</label>
            <input value={f.modelo} onChange={set('modelo')} placeholder="Ej. Corolla" />
          </div>
          <div className="field">
            <label>Año</label>
            <div className="range">
              <input type="number" value={f.anioMin} onChange={set('anioMin')} placeholder="Desde" />
              <input type="number" value={f.anioMax} onChange={set('anioMax')} placeholder="Hasta" />
            </div>
          </div>
          <div className="field">
            <label>Transmisión</label>
            <select value={f.transmision} onChange={set('transmision')}>
              <option value="">Todas</option>
              {catalogs.transmisiones.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Combustible</label>
            <select value={f.combustible} onChange={set('combustible')}>
              <option value="">Todos</option>
              {catalogs.combustibles.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Tren de manejo</label>
            <select value={f.traccion} onChange={set('traccion')}>
              <option value="">Todos</option>
              {catalogs.tracciones.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Cilindros</label>
            <select value={f.cilindros} onChange={set('cilindros')}>
              <option value="">Todos</option>
              {catalogs.cilindros.map((x) => (
                <option key={x} value={x}>
                  {x === 0 ? '0 (eléctrico)' : x}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Precio / oferta máxima (Q)</label>
            <input type="number" value={f.precioMax} onChange={set('precioMax')} placeholder="Ej. 80000" />
          </div>
        </aside>

        <section className="results">
          <div className="results-bar">
            <button className="btn btn-outline btn-sm filters-toggle" onClick={() => setShowFilters((s) => !s)}>
              {showFilters ? 'Ocultar filtros' : `Filtros${activeCount ? ` (${activeCount})` : ''}`}
            </button>
            <span className="muted">
              {vehicles ? `${filtered.length} de ${vehicles.length} vehículos` : ''}
              <span className="live-dot" title="Actualización en tiempo real" /> En vivo
            </span>
            <select value={f.orden} onChange={set('orden')} className="sort">
              <option value="cierre">Cierran pronto</option>
              <option value="recientes">Más recientes</option>
              <option value="precioAsc">Precio: menor a mayor</option>
              <option value="precioDesc">Precio: mayor a menor</option>
              <option value="anio">Año: más nuevo</option>
            </select>
          </div>

          {!vehicles ? (
            <Spinner text="Cargando inventario…" />
          ) : filtered.length === 0 ? (
            <div className="empty card">
              <h3>No hay vehículos que coincidan</h3>
              <p className="muted">Pruebe con otros filtros o publique el primer vehículo.</p>
              {activeCount > 0 && (
                <button className="btn btn-outline" onClick={() => setF(EMPTY_FILTERS)}>
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="vehicle-grid">
              {filtered.map((v) => (
                <VehicleCard key={v.id} vehicle={v} oferta={ofertas[v.id]} now={now} myBid={misPujas[v.id]} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
