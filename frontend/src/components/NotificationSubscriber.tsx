import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const NotificationSubscriber: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast, fetchNotifications } = useNotification();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user) return;

    const BASE_URL = import.meta.env.VITE_API_URL || '';
    const eventSource = new EventSource(`${BASE_URL}/api/v1/notifications/subscribe?token=${token}`);

    eventSource.addEventListener('notification', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('실시간 알림 수신:', data);
        
        if (data.message) {
          showToast(
            data.title || '새로운 알림', 
            data.message, 
            data.type?.toLowerCase() || 'info', 
            data.icon
          );
          fetchNotifications(); // 알림 발생 시 서버로부터 최신 알림 목록 가져와서 동기화
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
  }, [user, refreshUser, showToast, fetchNotifications]);

  return null; // UI를 렌더링하지 않음
};
