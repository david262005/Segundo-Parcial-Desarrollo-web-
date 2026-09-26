import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="empty card">
      <h2>Página no encontrada</h2>
      <Link to="/" className="btn btn-primary">
        Ir al inventario
      </Link>
    </div>
  );
}
