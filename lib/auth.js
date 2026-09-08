'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthAPI, setOnExpired } from './api';

const ACCESS = 'coopeci_admin_access';
const REFRESH = 'coopeci_admin_refresh';
const USER = 'coopeci_admin_user';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const clear = useCallback(() => {
    localStorage.removeItem(ACCESS); localStorage.removeItem(REFRESH); localStorage.removeItem(USER);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnExpired(() => { clear(); });
    try {
      const raw = localStorage.getItem(USER);
      const access = localStorage.getItem(ACCESS);
      if (raw && access) setUser(JSON.parse(raw));
    } catch (e) { clear(); }
    setLoading(false);
  }, [clear]);

  const login = useCallback(async (email, password) => {
    const { data } = await AuthAPI.login(email, password);
    localStorage.setItem(ACCESS, data.tokens.accessToken);
    localStorage.setItem(REFRESH, data.tokens.refreshToken || '');
    localStorage.setItem(USER, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await AuthAPI.logout(); } catch (e) {}
    clear();
  }, [clear]);

  return (
    <AuthContext.Provider value={{ loading, user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
