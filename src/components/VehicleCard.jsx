import { Link } from 'react-router-dom';
import { DamageBadge, StatusChip, BidStateBadge } from './Badges';
import Countdown from './Countdown';
import { auctionStatus } from '../utils/auction';
import { formatQ, vehicleTitle } from '../utils/format';

export default function VehicleCard({ vehicle, oferta, now, myBid, actions }) {
  const status = auctionStatus(vehicle, oferta, now);
  return (
    <article className="card vehicle-card">
      <Link to={`/vehiculo/${vehicle.id}`} className="vc-img">
        <img src={vehicle.portada} alt={vehicleTitle(vehicle)} loading="lazy" />
        <div className="vc-img-top">
          <StatusChip status={status} />
          <DamageBadge dano={vehicle.dano} />
        </div>
        <span className="vc-photos">📷 {vehicle.fotosCount}</span>
      </Link>

      <div className="vc-body">
        <div className="vc-type">{vehicle.tipo}</div>
        <h3 className="vc-title">
          <Link to={`/vehiculo/${vehicle.id}`}>{vehicleTitle(vehicle)}</Link>
        </h3>
        <ul className="vc-specs">
          <li>{vehicle.motor}</li>
          <li>{vehicle.transmision}</li>
          <li>{vehicle.combustible}</li>
          <li>{vehicle.traccion}</li>
          <li>{vehicle.cilindros > 0 ? `${vehicle.cilindros} cil.` : 'Sin cilindros'}</li>
        </ul>

        <div className="vc-price">
          <div>
            <small>{oferta ? `Oferta actual · ${oferta.cantidad} puja(s)` : 'Precio base'}</small>
            <strong key={oferta?.monto} className={oferta ? 'flash' : ''}>
              {formatQ(oferta ? oferta.monto : vehicle.precioBase)}
            </strong>
          </div>
          <Countdown vehicle={vehicle} now={now} />
        </div>

        <BidStateBadge myBid={myBid} oferta={oferta} status={status} compact />

        {actions || (
          <Link to={`/vehiculo/${vehicle.id}`} className="btn btn-primary btn-block">
            {status === 'activa' ? 'Ofertar ahora' : 'Ver detalle'}
          </Link>
        )}
      </div>
    </article>
  );
}
