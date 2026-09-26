import { DANO_INFO } from '../data/catalogs';
import { STATUS_INFO } from '../utils/auction';

export function DamageBadge({ dano, showDesc = false }) {
  const info = DANO_INFO[dano];
  if (!info) return null;
  return (
    <span className={`damage damage-${dano}`} title={info.desc}>
      <span className="dot" />
      {info.label}
      {showDesc && <small> · {info.desc}</small>}
    </span>
  );
}

export function StatusChip({ status }) {
  const info = STATUS_INFO[status];
  return <span className={`chip ${info.cls}`}>{status === 'activa' && <span className="pulse" />}{info.label}</span>;
}

/** Indicador del usuario: ganando o superado. */
export function BidStateBadge({ myBid, oferta, status, compact = false }) {
  if (myBid == null || !oferta) return null;
  const winning = myBid === oferta.monto;
  const closed = status === 'vendida' || status === 'desierta';
  if (winning) {
    return (
      <span className="badge badge-win">
        {closed ? '🏆 ¡Ganaste esta subasta!' : compact ? '✔ Ganando' : '¡Vas ganando esta subasta!'}
      </span>
    );
  }
  return (
    <span className="badge badge-lost">
      {closed
        ? 'Subasta finalizada: tu oferta fue superada'
        : compact
          ? '✖ Superado'
          : 'Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que termine el tiempo!'}
    </span>
  );
}
