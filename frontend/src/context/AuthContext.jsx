import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, usersApi } from '../api/userApi';
import { extractErrorMessage } from '../utils/helpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));
  const [loading, setLoading] = useState(true);

  // Parse JWT payload without verification (display only)
  const parseToken = (t) => {
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return payload;
    } catch {
      return null;
    }
  };

  // Fetch full user profile from user-service
  const fetchProfile = useCallback(async (t) => {
    const payload = parseToken(t);
    if (!payload?.sub) return null;
    try {
      const res = await usersApi.getById(payload.sub);
      return res.data?.data ?? res.data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) {
      setLoading(false);
      return;
    }
    fetchProfile(storedToken).then((profile) => {
      setUser(profile);
      setLoading(false);
    });
  }, [fetchProfile]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { accessToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    const profile = await fetchProfile(accessToken);
    setUser(profile);
    return profile;
  };

  const register = async (formData) => {
    const res = await authApi.register(formData);
    const { accessToken, user: newUser } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    setToken(accessToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (id, data) => {
    const res = await usersApi.update(id, data);
    const updated = res.data?.data ?? res.data;
    setUser(updated);
    return updated;
  };

  const hasRole = (...roles) => roles.includes(user?.role);
  const isAdmin = () => user?.role === 'Admin';
  const isAdminOrManager = () => ['Admin', 'StoreManager'].includes(user?.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateProfile,
        hasRole,
        isAdmin,
        isAdminOrManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
