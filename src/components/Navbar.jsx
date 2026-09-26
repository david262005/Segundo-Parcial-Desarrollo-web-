import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, displayName, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const close = () => setOpen(false);
  const handleLogout = async () => {
    await logout();
    close();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <img src="/favicon.svg" alt="" width="34" height="34" />
          <span>
            Subasta<strong>Auto</strong> <em>GT</em>
          </span>
        </Link>

        <button className="nav-toggle" aria-label="Abrir menú" onClick={() => setOpen((o) => !o)}>
          ☰
        </button>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>
            Inventario
          </NavLink>
          {user && (
            <>
              <NavLink to="/publicar" onClick={close}>
                Publicar vehículo
              </NavLink>
              <NavLink to="/mis-publicaciones" onClick={close}>
                Mis publicaciones
              </NavLink>
            </>
          )}
          {user ? (
            <div className="nav-user">
              <span className="avatar" title={displayName}>
                {(displayName || '?').charAt(0).toUpperCase()}
              </span>
              <span className="nav-name">{displayName}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Salir
              </button>
            </div>
          ) : (
            <div className="nav-user">
              <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>
                Iniciar sesión
              </Link>
              <Link to="/registro" className="btn btn-primary btn-sm" onClick={close}>
                Regístrese
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
