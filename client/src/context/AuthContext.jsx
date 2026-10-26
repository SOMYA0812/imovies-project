import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('imovies_user')); } catch { return null; } });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('imovies_token')));
  useEffect(() => { if (!localStorage.getItem('imovies_token')) { setLoading(false); return; } api.get('/auth/me').then(r => { setUser(r.data); localStorage.setItem('imovies_user', JSON.stringify(r.data)); }).catch(() => { localStorage.removeItem('imovies_token'); localStorage.removeItem('imovies_user'); setUser(null); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { const onUnauthorized = () => setUser(null); window.addEventListener('imovies:unauthorized', onUnauthorized); return () => window.removeEventListener('imovies:unauthorized', onUnauthorized); }, []);
  const login = async (path, values) => { const { data } = await api.post(`/auth/${path}`, values); localStorage.setItem('imovies_token', data.token); localStorage.setItem('imovies_user', JSON.stringify(data.user)); setUser(data.user); return data.user; };
  const logout = () => { localStorage.removeItem('imovies_token'); localStorage.removeItem('imovies_user'); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
