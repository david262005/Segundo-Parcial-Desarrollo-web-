// Catálogos por defecto. También se guardan en Firebase (/catalogs) mediante el script de seed;
// si la base de datos no los tiene, la app usa estos valores.
export const DEFAULT_CATALOGS = {
  tipos: ['Automóvil', 'SUV', 'Pickup', 'Van / Minivan', 'Motocicleta', 'Camión', 'Deportivo', 'Maquinaria'],
  marcas: [
    'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'GMC', 'Honda', 'Hyundai', 'Jeep', 'Kia', 'Lexus',
    'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'RAM', 'Subaru', 'Tesla', 'Toyota', 'Volkswagen',
  ],
  transmisiones: ['Automática', 'Manual', 'CVT'],
  combustibles: ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Flex'],
  tracciones: ['AWD', 'FWD', 'RWD', '4WD'],
  cilindros: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12],
  danos: [
    { id: 'verde', nombre: 'Verde', descripcion: 'Daño menor / Limpio' },
    { id: 'amarillo', nombre: 'Amarillo', descripcion: 'Daño medio / Reparable' },
    { id: 'rojo', nombre: 'Rojo', descripcion: 'Daño severo / Salvamento' },
  ],
};

export const DANO_INFO = {
  verde: { label: 'Verde', desc: 'Daño menor / Limpio' },
  amarillo: { label: 'Amarillo', desc: 'Daño medio / Reparable' },
  rojo: { label: 'Rojo', desc: 'Daño severo / Salvamento' },
};
