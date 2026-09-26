import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { placeBid } from '../services/bids';
import { auctionStatus, minBid } from '../utils/auction';
import { formatQ, formatDate } from '../utils/format';
import { StatusChip, BidStateBadge } from './Badges';
import Countdown from './Countdown';

export default function BidPanel({ vehicle, oferta, now }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [myBid, setMyBid] = useState(null);
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const status = auctionStatus(vehicle, oferta, now);
  const min = minBid(vehicle, oferta);
  const isOwner = user && user.uid === vehicle.ownerId;

  // Mi última puja en este vehículo (solo yo puedo leerla)
  useEffect(() => {
    if (!user) {
      setMyBid(null);
      return undefined;
    }
    return onValue(ref(db, `misPujas/${user.uid}/${vehicle.id}`), (s) => setMyBid(s.val()));
  }, [user, vehicle.id]);

  // Si alguien oferta, el monto sugerido sube automáticamente al nuevo mínimo
  useEffect(() => {
    setAmount((a) => (!a || Number(a) < min ? String(min) : a));
  }, [min]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const monto = Math.round(Number(amount));
    if (!Number.isFinite(monto) || monto <= 0) return setError('Ingrese un monto válido.');
    if (monto < vehicle.precioBase) return setError(`La oferta no puede ser menor al precio base (${formatQ(vehicle.precioBase)}).`);
    if (oferta && monto <= oferta.monto) return setError(`La oferta debe ser mayor a la oferta actual (${formatQ(oferta.monto)}).`);
    if (monto < min) return setError(`El incremento mínimo es del 10 %. Oferte al menos ${formatQ(min)}.`);

    setSending(true);
    try {
      await placeBid(user.uid, vehicle.id, monto, oferta);
      toast(`Oferta de ${formatQ(monto)} registrada. ¡Vas ganando!`, 'success');
    } catch (err) {
      console.error(err);
      setError(
        'El servidor rechazó la oferta: otro usuario ofertó primero, la subasta no está activa o el monto no cumple las reglas. Revise el monto mínimo e intente de nuevo.'
      );
    } finally {
      setSending(false);
    }
  };

  const quick = [min, Math.ceil(min * 1.05), Math.ceil(min * 1.15)];

  return (
    <aside className="card bid-panel">
      <div className="bp-head">
        <StatusChip status={status} />
        <span className="bp-count">{oferta ? `${oferta.cantidad} puja(s)` : 'Sin pujas'}</span>
      </div>

      <Countdown vehicle={vehicle} now={now} large />

      <div className="bp-current">
        <small>{oferta ? 'Oferta actual más alta' : 'Precio base (oferta inicial mínima)'}</small>
        <strong key={oferta?.monto} className="flash">
          {formatQ(oferta ? oferta.monto : vehicle.precioBase)}
        </strong>
        {oferta && <small className="muted">Precio base: {formatQ(vehicle.precioBase)} · Ofertante anónimo</small>}
      </div>

      <BidStateBadge myBid={myBid} oferta={oferta} status={status} />

      {status === 'activa' && !user && (
        <div className="bp-locked">
          <p>Debe iniciar sesión para ofertar en esta subasta.</p>
          <Link to="/login" state={{ from: location.pathname }} className="btn btn-primary btn-block">
            Iniciar sesión para ofertar
          </Link>
          <Link to="/registro" className="btn btn-ghost btn-block">
            Crear cuenta
          </Link>
        </div>
      )}

      {status === 'activa' && isOwner && (
        <div className="alert alert-info">Esta es tu publicación. No puedes ofertar en tus propios vehículos.</div>
      )}

      {status === 'activa' && user && !isOwner && (
        <form onSubmit={submit} className="bp-form">
          <label htmlFor="monto">
            Tu oferta (mínimo <strong>{formatQ(min)}</strong>)
          </label>
          <div className="input-money">
            <span>Q</span>
            <input
              id="monto"
              type="number"
              min={min}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="quick-bids">
            {quick.map((q) => (
              <button type="button" key={q} className="btn btn-outline btn-sm" onClick={() => setAmount(String(q))}>
                {formatQ(q)}
              </button>
            ))}
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn btn-accent btn-block btn-lg" disabled={sending}>
            {sending ? 'Enviando…' : 'Ofertar'}
          </button>
          <p className="hint">Cada oferta debe superar la actual en al menos 10 %. Tu identidad no se muestra a otros usuarios.</p>
        </form>
      )}

      {status === 'proxima' && (
        <div className="alert alert-info">La subasta inicia el {formatDate(vehicle.inicio)}. Aún no se aceptan ofertas.</div>
      )}

      {(status === 'vendida' || status === 'desierta') && (
        <div className={`alert ${status === 'vendida' ? 'alert-success' : 'alert-warning'}`}>
          <strong>Oferta cerrada.</strong>{' '}
          {status === 'vendida'
            ? `Subasta finalizada con una oferta ganadora de ${formatQ(oferta.monto)}.`
            : 'No se alcanzó el monto base: la subasta se declara no vendida / desierta.'}
        </div>
      )}

      <dl className="bp-dates">
        <div>
          <dt>Inicio</dt>
          <dd>{formatDate(vehicle.inicio)}</dd>
        </div>
        <div>
          <dt>Cierre</dt>
          <dd>{formatDate(vehicle.cierre)}</dd>
        </div>
      </dl>
    </aside>
  );
}
