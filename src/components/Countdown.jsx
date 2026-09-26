import { formatCountdown } from '../utils/format';

/** Temporizador según la hora del servidor (`now`). */
export default function Countdown({ vehicle, now, large = false }) {
  let label;
  let ms;
  if (now < vehicle.inicio) {
    label = 'Inicia en';
    ms = vehicle.inicio - now;
  } else if (now < vehicle.cierre) {
    label = 'Cierra en';
    ms = vehicle.cierre - now;
  } else {
    return <div className={`countdown ended ${large ? 'large' : ''}`}>Subasta cerrada</div>;
  }
  const urgent = now >= vehicle.inicio && ms < 5 * 60 * 1000;
  return (
    <div className={`countdown ${urgent ? 'urgent' : ''} ${large ? 'large' : ''}`}>
      <span className="cd-label">{label}</span>
      <span className="cd-time">{formatCountdown(ms)}</span>
    </div>
  );
}
