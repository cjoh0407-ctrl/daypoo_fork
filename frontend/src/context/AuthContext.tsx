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
  logout: () => void;
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
    } catch (err) {
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

  // SSE 실시간 알림 구독
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    // TODO: 백엔드 도메인이 다를 경우 URL 확인 필요
    const BASE_URL = import.meta.env.VITE_API_URL || '';
    const eventSource = new EventSource(`${BASE_URL}/api/v1/notifications/subscribe?token=${token}`);

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('실시간 알림 수신:', data);
        // 브라우저 기본 알림 또는 UI 토스트 (여기서는 간단히 알림 전파 로그)
        if (data.message) {
          alert(`🔔 새 알림: ${data.message}`);
          refreshUser(); // 알림 발생 시 유저 정보(포인트 등) 갱신
        }
      } catch (err) {
        console.error('알림 파싱 실패:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.error('SSE 연결 에러:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user, refreshUser]);

  const login = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
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
