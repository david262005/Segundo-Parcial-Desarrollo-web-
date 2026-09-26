import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getVehicleWithFotos, updateVehicle } from '../services/vehicles';
import { vehicleTitle } from '../utils/format';
import VehicleForm from '../components/VehicleForm';
import Spinner from '../components/Spinner';

export default function EditVehicle() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    Promise.all([getVehicleWithFotos(id), get(ref(db, `ofertas/${id}`))]).then(([data, oferta]) =>
      setState({ loading: false, data, hasBids: oferta.exists() })
    );
  }, [id]);

  if (state.loading) return <Spinner />;
  if (!state.data || state.data.vehicle.ownerId !== user.uid)
    return (
      <div className="empty card">
        <h2>No puede editar este vehículo</h2>
        <p className="muted">Solo el publicador puede editar su publicación.</p>
        <Link to="/mis-publicaciones" className="btn btn-primary">
          Mis publicaciones
        </Link>
      </div>
    );

  const { vehicle, fotos } = state.data;

  const onSubmit = async (data, newFotos) => {
    await updateVehicle(user.uid, vehicle, data, newFotos);
    toast('Publicación actualizada', 'success');
    navigate(`/vehiculo/${id}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Editar: {vehicleTitle(vehicle)}</h1>
        <Link to="/mis-publicaciones" className="link-btn">
          ← Volver a mis publicaciones
        </Link>
      </div>
      <VehicleForm initial={vehicle} initialFotos={fotos} lockAuction={state.hasBids} submitLabel="Guardar cambios" onSubmit={onSubmit} />
    </div>
  );
}
