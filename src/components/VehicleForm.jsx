import { useState } from 'react';
import { useCatalogs } from '../services/catalogs';
import { compressImage } from '../utils/images';
import { toLocalInput, fromLocalInput } from '../utils/format';
import { serverNow } from '../hooks/useServerTime';

const MIN_FOTOS = 5;
const MAX_FOTOS = 10;

function defaultValues() {
  const start = Math.ceil(Date.now() / 60000) * 60000;
  return {
    anio: '',
    tipo: '',
    marca: '',
    modelo: '',
    motor: '',
    transmision: '',
    combustible: '',
    traccion: '',
    cilindros: '',
    dano: '',
    precioBase: '',
    inicio: toLocalInput(start),
    cierre: toLocalInput(start + 3 * 24 * 3600 * 1000),
    descripcion: '',
  };
}

/**
 * Formulario de publicación / edición.
 * `lockAuction`: si ya existen pujas no se permite modificar precio base ni fechas.
 */
export default function VehicleForm({ initial, initialFotos = [], lockAuction = false, submitLabel, onSubmit }) {
  const catalogs = useCatalogs();
  const [values, setValues] = useState(() =>
    initial
      ? {
          ...defaultValues(),
          ...initial,
          anio: String(initial.anio),
          cilindros: String(initial.cilindros),
          precioBase: String(initial.precioBase),
          inicio: toLocalInput(initial.inicio),
          cierre: toLocalInput(initial.cierre),
          descripcion: initial.descripcion || '',
        }
      : defaultValues()
  );
  const [fotos, setFotos] = useState(initialFotos);
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const maxYear = new Date().getFullYear() + 1;

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const available = MAX_FOTOS - fotos.length;
    if (available <= 0) return setFormError(`Máximo ${MAX_FOTOS} fotografías.`);
    setProcessing(true);
    setFormError('');
    try {
      const nuevas = [];
      for (const f of files.slice(0, available)) nuevas.push(await compressImage(f));
      setFotos((prev) => [...prev, ...nuevas]);
      if (files.length > available) setFormError(`Solo se agregaron ${available} fotos (máximo ${MAX_FOTOS}).`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const removeFoto = (i) => setFotos((f) => f.filter((_, idx) => idx !== i));
  const makeCover = (i) => setFotos((f) => [f[i], ...f.filter((_, idx) => idx !== i)]);
  const moveFoto = (i, dir) =>
    setFotos((f) => {
      const j = i + dir;
      if (j < 0 || j >= f.length) return f;
      const copy = [...f];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const validate = () => {
    const e = {};
    const req = ['anio', 'tipo', 'marca', 'modelo', 'motor', 'transmision', 'combustible', 'traccion', 'cilindros', 'dano', 'precioBase', 'inicio', 'cierre'];
    req.forEach((k) => {
      if (!String(values[k]).trim()) e[k] = 'Campo obligatorio';
    });
    const anio = Number(values.anio);
    if (values.anio && (!Number.isInteger(anio) || anio < 1950 || anio > maxYear)) e.anio = `Año entre 1950 y ${maxYear}`;
    const precio = Number(values.precioBase);
    if (values.precioBase && (!(precio > 0) || !Number.isInteger(precio))) e.precioBase = 'Monto entero mayor a 0';
    const inicio = fromLocalInput(values.inicio);
    const cierre = fromLocalInput(values.cierre);
    if (values.inicio && values.cierre && cierre <= inicio) e.cierre = 'El cierre debe ser posterior al inicio';
    if (!lockAuction && values.cierre && cierre <= serverNow()) e.cierre = 'El cierre debe ser una fecha futura';
    if (fotos.length < MIN_FOTOS) e.fotos = `Debe subir mínimo ${MIN_FOTOS} fotografías (lleva ${fotos.length}).`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!validate()) {
      setFormError('Revise los campos marcados en rojo.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ ...values, inicio: fromLocalInput(values.inicio), cierre: fromLocalInput(values.cierre) }, fotos);
    } catch (err) {
      console.error(err);
      setFormError(
        err?.code === 'PERMISSION_DENIED' || /permission/i.test(err?.message)
          ? 'El servidor rechazó la operación. Verifique los datos (si el vehículo ya tiene pujas no puede cambiar precio ni fechas).'
          : err.message || 'No se pudo guardar.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ name, label, children, hint }) => (
    <div className={`field ${errors[name] ? 'has-error' : ''}`}>
      <label htmlFor={name}>
        {label} <span className="req">*</span>
      </label>
      {children}
      {errors[name] ? <small className="error">{errors[name]}</small> : hint && <small className="hint">{hint}</small>}
    </div>
  );

  const select = (name, options) => (
    <select id={name} value={values[name]} onChange={set(name)}>
      <option value="">Seleccione…</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o === 0 ? '0 (eléctrico)' : o}
        </option>
      ))}
    </select>
  );

  return (
    <form className="vehicle-form" onSubmit={submit} noValidate>
      <section className="card form-section">
        <h2>1. Ficha técnica</h2>
        <div className="grid-3">
          {Field({ name: 'anio', label: 'Año', children: <input id="anio" type="number" min="1950" max={maxYear} value={values.anio} onChange={set('anio')} placeholder="2020" /> })}
          {Field({ name: 'tipo', label: 'Tipo de artículo', children: select('tipo', catalogs.tipos) })}
          {Field({ name: 'marca', label: 'Marca', children: select('marca', catalogs.marcas) })}
          {Field({ name: 'modelo', label: 'Modelo', children: <input id="modelo" value={values.modelo} onChange={set('modelo')} placeholder="Corolla LE" maxLength={60} /> })}
          {Field({ name: 'motor', label: 'Motor', children: <input id="motor" value={values.motor} onChange={set('motor')} placeholder="1.8L I4" maxLength={60} /> })}
          {Field({ name: 'transmision', label: 'Transmisión', children: select('transmision', catalogs.transmisiones) })}
          {Field({ name: 'combustible', label: 'Tipo de combustible', children: select('combustible', catalogs.combustibles) })}
          {Field({ name: 'traccion', label: 'Tren de manejo', children: select('traccion', catalogs.tracciones) })}
          {Field({ name: 'cilindros', label: 'Número de cilindros', children: select('cilindros', catalogs.cilindros) })}
        </div>
        <div className="field">
          <label htmlFor="descripcion">Descripción / observaciones (opcional)</label>
          <textarea id="descripcion" rows="3" maxLength={1000} value={values.descripcion} onChange={set('descripcion')} placeholder="Llaves disponibles, arranca y camina, detalles del daño…" />
        </div>
      </section>

      <section className="card form-section">
        <h2>2. Clasificación por estado de daño</h2>
        <div className={`damage-options ${errors.dano ? 'has-error' : ''}`}>
          {catalogs.danos.map((d) => (
            <label key={d.id} className={`damage-option damage-opt-${d.id} ${values.dano === d.id ? 'selected' : ''}`}>
              <input type="radio" name="dano" value={d.id} checked={values.dano === d.id} onChange={set('dano')} />
              <span className="dot" />
              <span>
                <strong>{d.nombre}</strong>
                <small>{d.descripcion}</small>
              </span>
            </label>
          ))}
        </div>
        {errors.dano && <small className="error">Seleccione el nivel de daño</small>}
      </section>

      <section className="card form-section">
        <h2>3. Galería fotográfica</h2>
        <p className="muted">
          Mínimo {MIN_FOTOS} y máximo {MAX_FOTOS} fotografías. La primera será la portada. Las imágenes se optimizan automáticamente.
        </p>
        <div className="photo-grid">
          {fotos.map((src, i) => (
            <div key={i} className={`photo-item ${i === 0 ? 'cover' : ''}`}>
              <img src={src} alt={`Foto ${i + 1}`} />
              {i === 0 && <span className="photo-cover">Portada</span>}
              <div className="photo-actions">
                <button type="button" onClick={() => moveFoto(i, -1)} title="Mover a la izquierda">◀</button>
                {i !== 0 && <button type="button" onClick={() => makeCover(i)} title="Usar como portada">★</button>}
                <button type="button" onClick={() => moveFoto(i, 1)} title="Mover a la derecha">▶</button>
                <button type="button" className="danger" onClick={() => removeFoto(i)} title="Eliminar">✕</button>
              </div>
            </div>
          ))}
          {fotos.length < MAX_FOTOS && (
            <label className="photo-add">
              <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={processing} />
              <span className="plus">＋</span>
              <span>{processing ? 'Procesando…' : 'Agregar fotos'}</span>
            </label>
          )}
        </div>
        <div className={`photo-progress ${fotos.length >= MIN_FOTOS ? 'ok' : ''}`}>
          {fotos.length}/{MIN_FOTOS} fotos mínimas {fotos.length >= MIN_FOTOS ? '✔' : ''}
        </div>
        {errors.fotos && <small className="error">{errors.fotos}</small>}
      </section>

      <section className="card form-section">
        <h2>4. Parámetros de la subasta</h2>
        {lockAuction && (
          <div className="alert alert-info">Este vehículo ya recibió ofertas: el precio base y las fechas no se pueden modificar.</div>
        )}
        <div className="grid-3">
          {Field({
            name: 'precioBase',
            label: 'Precio / monto base (Q)',
            hint: 'Oferta mínima con la que inicia la subasta',
            children: <input id="precioBase" type="number" min="1" step="1" value={values.precioBase} onChange={set('precioBase')} placeholder="20000" disabled={lockAuction} />,
          })}
          {Field({ name: 'inicio', label: 'Fecha y hora de inicio', children: <input id="inicio" type="datetime-local" value={values.inicio} onChange={set('inicio')} disabled={lockAuction} /> })}
          {Field({ name: 'cierre', label: 'Fecha y hora de cierre', children: <input id="cierre" type="datetime-local" value={values.cierre} onChange={set('cierre')} disabled={lockAuction} /> })}
        </div>
      </section>

      {formError && <div className="alert alert-error">{formError}</div>}
      <div className="form-actions">
        <button className="btn btn-primary btn-lg" disabled={submitting || processing}>
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
