import { createContext, useContext, useState, useCallback } from 'react';
import { userApi } from '../config/api.js';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return {};
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); }
    catch { return null; }
  });

  const storeSession = (accessToken) => {
    const payload  = parseJwt(accessToken);
    const userData = { id: payload.sub, role: payload.role, email: payload.email };
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const login = useCallback(async (email, password) => {
    const res = await userApi.post('/api/auth/login', { email, password });
    return storeSession(res.data.data.accessToken);
  }, []);

  const register = useCallback(async (data) => {
    const res = await userApi.post('/api/auth/register', data);
    return storeSession(res.data.data.accessToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
