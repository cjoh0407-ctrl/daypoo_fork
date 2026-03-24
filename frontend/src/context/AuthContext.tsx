import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';

interface User {
  email: string;
  nickname: string;
  role: string;
  points: number;
  level: number;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteMe: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch (err: any) {
      console.error('Failed to fetch user', err);
      // 토큰이 유효하지 않으면 로그아웃 처리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    // SSE 로직은 별도 Subscriber 컴포넌트로 이동함
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    await refreshUser();
  };

  const logout = useCallback(async () => {
    try {
      // 서버 로그아웃 API 호출 (토큰 블랙리스트 처리 등)
      await api.post('/auth/logout').catch(err => {
        console.warn('Backend logout failed or not implemented:', err);
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  }, []);

  const deleteMe = useCallback(async (password: string) => {
    try {
      await api.delete('/auth/me', { password });
      await logout();
    } catch (err: any) {
      console.error('Failed to delete account', err);
      throw err;
    }
  }, [logout]);

  const value = {
    user,
    loading,
    login,
    logout,
    deleteMe,
    refreshUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
