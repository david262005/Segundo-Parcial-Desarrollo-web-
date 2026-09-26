const money = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ', maximumFractionDigits: 0 });

export const formatQ = (n) => money.format(Number(n) || 0);

export const formatDate = (ms) =>
  new Date(ms).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' });

export const vehicleTitle = (v) => `${v.anio} ${v.marca} ${v.modelo}`;

// Convierte milisegundos a valor aceptado por <input type="datetime-local">
export function toLocalInput(ms) {
  const d = new Date(ms);
  return new Date(ms - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export const fromLocalInput = (s) => new Date(s).getTime();

export function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (x) => String(x).padStart(2, '0');
  return `${d > 0 ? `${d}d ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
}
