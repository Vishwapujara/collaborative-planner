import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for storage
const setAuthToken = (token: string, rememberMe: boolean = false) => {
  // Always set in sessionStorage (tab-specific)
  sessionStorage.setItem('token', token);
  
  // Optionally set in localStorage (persistent across browser restarts)
  if (rememberMe) {
    localStorage.setItem('token', token);
    localStorage.setItem('rememberMe', 'true');
  }
};

const getAuthToken = (): string | null => {
  // First check sessionStorage (current tab)
  const sessionToken = sessionStorage.getItem('token');
  if (sessionToken) return sessionToken;
  
  // Then check localStorage (if "remember me" was checked)
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  if (rememberMe) {
    const localToken = localStorage.getItem('token');
    if (localToken) {
      // Copy to sessionStorage for this tab
      sessionStorage.setItem('token', localToken);
      return localToken;
    }
  }
  
  return null;
};

const clearAuthToken = () => {
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
  localStorage.removeItem('rememberMe');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = getAuthToken();
      if (savedToken) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
          setToken(savedToken);
        } catch (error) {
          console.error('Failed to get current user:', error);
          clearAuthToken();
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    const response = await authAPI.login({ email, password });
    const { user, token } = response.data;
    
    setAuthToken(token, rememberMe);
    setToken(token);
    setUser(user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authAPI.register({ name, email, password });
    const { user, token } = response.data;
    
    setAuthToken(token, false); // Don't auto-remember on registration
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};