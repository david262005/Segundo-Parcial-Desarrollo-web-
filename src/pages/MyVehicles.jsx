import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeMyVehicles } from '../services/vehicles';
import { subscribeOfertas } from '../services/bids';
import { useNow } from '../hooks/useServerTime';
import { auctionStatus } from '../utils/auction';
import VehicleCard from '../components/VehicleCard';
import Spinner from '../components/Spinner';

export default function MyVehicles() {
  const { user } = useAuth();
  const now = useNow();
  const [vehicles, setVehicles] = useState(null);
  const [ofertas, setOfertas] = useState({});
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('');

  useEffect(() => {
    const u1 = subscribeMyVehicles(user.uid, setVehicles);
    const u2 = subscribeOfertas(setOfertas);
    return () => {
      u1();
      u2();
    };
  }, [user.uid]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (vehicles || [])
      .filter((v) => !t || `${v.anio} ${v.marca} ${v.modelo} ${v.motor} ${v.tipo} ${v.id}`.toLowerCase().includes(t))
      .filter((v) => {
        if (!estado) return true;
        const s = auctionStatus(v, ofertas[v.id], now);
        return estado === 'cerrada' ? s === 'vendida' || s === 'desierta' : s === estado;
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [vehicles, ofertas, q, estado, now]);

  return (
    <div className="page">
      <div className="page-head row">
        <div>
          <h1>Mis publicaciones</h1>
          <p className="muted">Busque y edite los vehículos que ha publicado.</p>
        </div>
        <Link to="/publicar" className="btn btn-accent">
          ＋ Publicar vehículo
        </Link>
      </div>

      <div className="card toolbar">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por año, marca, modelo, motor o lote…" />
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activa">En subasta</option>
          <option value="proxima">Próximamente</option>
          <option value="cerrada">Cerradas</option>
        </select>
      </div>

      {!vehicles ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div className="empty card">
          <h3>{vehicles.length ? 'Sin resultados para la búsqueda' : 'Aún no ha publicado vehículos'}</h3>
          <Link to="/publicar" className="btn btn-primary">
            Publicar mi primer vehículo
          </Link>
        </div>
      ) : (
        <div className="vehicle-grid">
          {filtered.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              oferta={ofertas[v.id]}
              now={now}
              actions={
                <div className="card-actions">
                  <Link to={`/editar/${v.id}`} className="btn btn-primary">
                    ✎ Editar
                  </Link>
                  <Link to={`/vehiculo/${v.id}`} className="btn btn-outline">
                    Ver subasta
                  </Link>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
