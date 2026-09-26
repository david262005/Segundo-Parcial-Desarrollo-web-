import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createVehicle } from '../services/vehicles';
import VehicleForm from '../components/VehicleForm';

export default function Publish() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const onSubmit = async (data, fotos) => {
    const id = await createVehicle(user.uid, data, fotos);
    toast('¡Vehículo publicado correctamente!', 'success');
    navigate(`/vehiculo/${id}`);
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>Publicar vehículo para subasta</h1>
        <p className="muted">Todos los campos marcados con * son obligatorios.</p>
      </div>
      <VehicleForm submitLabel="Publicar vehículo" onSubmit={onSubmit} />
    </div>
  );
}
