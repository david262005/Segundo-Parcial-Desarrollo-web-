import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { ref, get, set, serverTimestamp } from 'firebase/database';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          try {
            const snap = await get(ref(db, `users/${u.uid}`));
            setProfile(snap.val());
          } catch {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }),
    []
  );

  const login = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);

  const register = async ({ nombre, apellido, email, telefono, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: `${nombre} ${apellido}` });
    const data = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: cred.user.email,
      telefono: telefono.trim(),
      createdAt: serverTimestamp(),
    };
    await set(ref(db, `users/${cred.user.uid}`), data);
    setProfile({ ...data, createdAt: Date.now() });
  };

  const logout = () => signOut(auth);

  const displayName = profile ? `${profile.nombre} ${profile.apellido}` : user?.displayName || user?.email;

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function authErrorMessage(err) {
  const map = {
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/email-already-in-use': 'Ya existe una cuenta registrada con ese correo.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/weak-password': 'La contraseña es demasiado débil.',
    'auth/too-many-requests': 'Demasiados intentos. Espere un momento e intente de nuevo.',
    'auth/network-request-failed': 'Error de red. Verifique su conexión.',
    'auth/operation-not-allowed': 'El inicio de sesión con correo no está habilitado en Firebase.',
  };
  return map[err?.code] || err?.message || 'Ocurrió un error inesperado.';
}
