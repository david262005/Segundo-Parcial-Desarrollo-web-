// Reglas de negocio de la subasta (las mismas se validan en el servidor: database.rules.json)
export const INCREMENTO_MINIMO = 0.1; // 10 %

/** Estado de la subasta: 'proxima' | 'activa' | 'vendida' | 'desierta' */
export function auctionStatus(vehicle, oferta, now) {
  if (now < vehicle.inicio) return 'proxima';
  if (now < vehicle.cierre) return 'activa';
  return oferta ? 'vendida' : 'desierta';
}

/** Monto mínimo aceptado para la siguiente oferta (entero, en quetzales). */
export function minBid(vehicle, oferta) {
  if (!oferta) return vehicle.precioBase;
  return Math.ceil((oferta.monto * 11) / 10);
}

export const STATUS_INFO = {
  proxima: { label: 'Próximamente', cls: 'chip-info' },
  activa: { label: 'En subasta', cls: 'chip-live' },
  vendida: { label: 'Cerrada · Vendida', cls: 'chip-muted' },
  desierta: { label: 'Cerrada · Desierta', cls: 'chip-muted' },
};
