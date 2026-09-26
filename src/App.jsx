import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { firebaseReady } from './firebase';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import OutbidWatcher from './components/OutbidWatcher';
import Home from './pages/Home';
import VehicleDetail from './pages/VehicleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Publish from './pages/Publish';
import EditVehicle from './pages/EditVehicle';
import MyVehicles from './pages/MyVehicles';
import NotFound from './pages/NotFound';

function SetupNeeded() {
  return (
    <div className="container">
      <div className="empty card">
        <h2>Falta configurar Firebase</h2>
        <p className="muted">
          Copie <code>.env.example</code> como <code>.env</code>, complete las variables de su proyecto Firebase y reinicie el servidor.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  if (!firebaseReady) return <SetupNeeded />;
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Navbar />
          <OutbidWatcher />
          <main className="container main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/vehiculo/:id" element={<VehicleDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/publicar" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
              <Route path="/mis-publicaciones" element={<ProtectedRoute><MyVehicles /></ProtectedRoute>} />
              <Route path="/editar/:id" element={<ProtectedRoute><EditVehicle /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="footer">
            <div className="container">
              SubastaAuto GT · Desarrollo y Diseño Web · Universidad Mariano Gálvez, Guastatoya
            </div>
          </footer>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
