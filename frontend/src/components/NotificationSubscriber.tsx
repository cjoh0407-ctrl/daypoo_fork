import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/apiClient';

export const NotificationSubscriber: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast, fetchNotifications } = useNotification();
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<any>(null);

  const connectSSE = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken || !user) return;

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      const BASE_URL = import.meta.env.VITE_API_URL || '';
      
      // SSE 전용 단기 토큰 발급 시도 (백엔드 미구현 시 에러 발생 가능)
      let subToken = accessToken;
      try {
        const res: any = await api.post('/notifications/sse-token', {});
        if (res && res.sseToken) subToken = res.sseToken;
      } catch (err) {
        // 백엔드 미구현 시 기존 토큰으로 Fallback
        console.warn('SSE 전용 토큰 발급 실패, 기존 토큰 사용:', err);
      }

      const eventSource = new EventSource(`${BASE_URL}/api/v1/notifications/subscribe?token=${subToken}`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('notification', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
            showToast(
              data.title || '새로운 알림', 
              data.message, 
              data.type?.toLowerCase() || 'info', 
              data.icon
            );
            fetchNotifications(); 
            refreshUser(); 
          }
        } catch (err) {
          console.error('알림 파싱 실패:', err);
        }
      });

      eventSource.onerror = (err) => {
        console.error('SSE 연결 에러 (재연결 시도 중):', err);
        eventSource.close();
        
        // 5초 후 재연결 시도
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 5000);
      };

    } catch (err) {
      console.error('SSE 연결 실패:', err);
    }
  }, [user, refreshUser, showToast, fetchNotifications]);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [connectSSE, retryCount]);

  return null;
};
