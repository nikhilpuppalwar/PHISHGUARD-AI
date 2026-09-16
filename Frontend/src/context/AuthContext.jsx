import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, getAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.auth.me();
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch current user session:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setAuthToken(res.access_token);
    await fetchCurrentUser();
    return res;
  };

  const register = async (email, password, role = 'Student') => {
    const res = await api.auth.register(email, password, role);
    setAuthToken(res.access_token);
    await fetchCurrentUser();
    return res;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
