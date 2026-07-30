import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('eventhub_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('eventhub_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await api.getProfile();
          setUser(res.user);
          localStorage.setItem('eventhub_user', JSON.stringify(res.user));
        } catch (err) {
          console.warn('Token expired or invalid. Logging out.');
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('eventhub_token', res.token);
    localStorage.setItem('eventhub_user', JSON.stringify(res.user));
    return res.user;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('eventhub_token', res.token);
    localStorage.setItem('eventhub_user', JSON.stringify(res.user));
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eventhub_token');
    localStorage.removeItem('eventhub_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
