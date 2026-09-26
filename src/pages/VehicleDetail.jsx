import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { subscribeVehicle, subscribeFotos } from '../services/vehicles';
import { subscribeOferta } from '../services/bids';
import { useAuth } from '../context/AuthContext';
import { useNow } from '../hooks/useServerTime';
import { formatQ, formatDate, vehicleTitle } from '../utils/format';
import { DamageBadge } from '../components/Badges';
import Carousel from '../components/Carousel';
import BidPanel from '../components/BidPanel';
import Spinner from '../components/Spinner';

export default function VehicleDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const now = useNow();
  const [vehicle, setVehicle] = useState(undefined);
  const [fotos, setFotos] = useState([]);
  const [oferta, setOferta] = useState(null);

  // Suscripciones en tiempo real: ficha, fotos y oferta más alta
  useEffect(() => {
    const unsubs = [subscribeVehicle(id, setVehicle), subscribeFotos(id, setFotos), subscribeOferta(id, setOferta)];
    return () => unsubs.forEach((u) => u());
  }, [id]);

  if (vehicle === undefined) return <Spinner />;
  if (vehicle === null)
    return (
      <div className="empty card">
        <h2>Vehículo no encontrado</h2>
        <Link to="/" className="btn btn-primary">
          Volver al inventario
        </Link>
      </div>
    );

  const specs = [
    ['Año', vehicle.anio],
    ['Tipo de artículo', vehicle.tipo],
    ['Marca', vehicle.marca],
    ['Modelo', vehicle.modelo],
    ['Motor', vehicle.motor],
    ['Transmisión', vehicle.transmision],
    ['Tipo de combustible', vehicle.combustible],
    ['Tren de manejo', vehicle.traccion],
    ['Número de cilindros', vehicle.cilindros > 0 ? vehicle.cilindros : '0 (eléctrico)'],
    ['Estado de daño', <DamageBadge key="d" dano={vehicle.dano} showDesc />],
    ['Precio base', formatQ(vehicle.precioBase)],
    ['Fecha y hora de inicio', formatDate(vehicle.inicio)],
    ['Fecha y hora de cierre', formatDate(vehicle.cierre)],
  ];

  return (
    <div className="detail">
      <nav className="breadcrumb">
        <Link to="/">Inventario</Link> / <span>{vehicleTitle(vehicle)}</span>
      </nav>

      <div className="detail-head">
        <div>
          <span className="vc-type">{vehicle.tipo}</span>
          <h1>{vehicleTitle(vehicle)}</h1>
          <div className="detail-tags">
            <DamageBadge dano={vehicle.dano} showDesc />
            <span className="tag">{vehicle.motor}</span>
            <span className="tag">{vehicle.traccion}</span>
            <span className="tag">Lote #{vehicle.id.slice(-6).toUpperCase()}</span>
          </div>
        </div>
        {user?.uid === vehicle.ownerId && (
          <Link to={`/editar/${vehicle.id}`} className="btn btn-outline">
            ✎ Editar publicación
          </Link>
        )}
      </div>

      <div className="detail-grid">
        <div className="detail-main">
          <Carousel images={fotos} alt={vehicleTitle(vehicle)} />

          <section className="card specs">
            <h2>Ficha técnica</h2>
            <dl className="spec-table">
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {vehicle.descripcion && (
              <>
                <h3>Observaciones</h3>
                <p className="description">{vehicle.descripcion}</p>
              </>
            )}
          </section>
        </div>

        <BidPanel vehicle={vehicle} oferta={oferta} now={now} />
      </div>
    </div>
  );
}
