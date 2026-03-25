import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';
import { UserResponse } from '../types/api';

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteMe: (password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    console.log('[AuthContext] refreshUser called. Has token:', !!token);

    if (!token) {
      console.log('[AuthContext] No token found. Setting user to null.');
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      console.log('[AuthContext] Fetching user info from /auth/me...');
      const userData = await api.get('/auth/me');
      console.log('[AuthContext] ✅ User data received:', {
        email: userData.email,
        nickname: userData.nickname,
        role: userData.role
      });
      setUser(userData as UserResponse);
    } catch (err: any) {
      console.error('[AuthContext] ❌ Failed to fetch user:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      // 토큰이 유효하지 않으면 로그아웃 처리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
      console.log('[AuthContext] Loading complete. User:', !!user);
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
      await api.delete(`/auth/me?password=${encodeURIComponent(password)}`);
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
