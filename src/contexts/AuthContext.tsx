// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import api from "../api"

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (username: string, password: string) => {
    // 调用API
    let params = {}
    const result = await api.post("login",{username,password});
    setIsAuthenticated(result.success);
    return result.success;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const value = { isAuthenticated, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
