import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, authErrorMessage } from '../context/AuthContext';

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'Mínimo 8 caracteres' },
  { test: (p) => /[A-Z]/.test(p), label: 'Una letra mayúscula' },
  { test: (p) => /[a-z]/.test(p), label: 'Una letra minúscula' },
  { test: (p) => /\d/.test(p), label: 'Un número' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Un carácter especial (!@#$…)' },
];

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to="/" replace />;

  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }));
  const passed = PASSWORD_RULES.filter((r) => r.test(v.password)).length;
  const strength = ['Muy débil', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Segura'][passed];

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (v.nombre.trim().length < 2 || v.apellido.trim().length < 2) return setError('Ingrese nombre y apellido válidos.');
    if (!/^[0-9+ -]{8,20}$/.test(v.telefono.trim())) return setError('Ingrese un teléfono válido (mínimo 8 dígitos).');
    if (passed < PASSWORD_RULES.length) return setError('La contraseña no cumple los requisitos de seguridad.');
    if (v.password !== v.confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await register(v);
      navigate('/', { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card wide" onSubmit={submit}>
        <h1>Crear cuenta</h1>
        <p className="muted">El registro es obligatorio para ofertar y publicar vehículos.</p>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <input id="nombre" value={v.nombre} onChange={set('nombre')} required maxLength={60} autoComplete="given-name" />
          </div>
          <div className="field">
            <label htmlFor="apellido">Apellido</label>
            <input id="apellido" value={v.apellido} onChange={set('apellido')} required maxLength={60} autoComplete="family-name" />
          </div>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={v.email} onChange={set('email')} required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="telefono">Teléfono</label>
            <input id="telefono" type="tel" value={v.telefono} onChange={set('telefono')} required placeholder="5555 1234" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña segura</label>
            <input id="password" type="password" value={v.password} onChange={set('password')} required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <input id="confirm" type="password" value={v.confirm} onChange={set('confirm')} required autoComplete="new-password" />
          </div>
        </div>

        <div className="pw-strength">
          <div className="pw-bar">
            <span style={{ width: `${(passed / PASSWORD_RULES.length) * 100}%` }} className={`lvl-${passed}`} />
          </div>
          <small>Seguridad: {v.password ? strength : '—'}</small>
          <ul>
            {PASSWORD_RULES.map((r) => (
              <li key={r.label} className={r.test(v.password) ? 'ok' : ''}>
                {r.test(v.password) ? '✔' : '○'} {r.label}
              </li>
            ))}
          </ul>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? 'Creando cuenta…' : 'Registrarme'}
        </button>
        <p className="auth-switch">
          ¿Ya tiene cuenta? <Link to="/login">Inicie sesión</Link>
        </p>
      </form>
    </div>
  );
}
