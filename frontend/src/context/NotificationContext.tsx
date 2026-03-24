import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationToast, ToastType } from '../components/NotificationToast';
import { api } from '../services/apiClient';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  icon?: string;
}

export interface Notification {
  id: number;
  type: 'INFO' | 'ACHIEVEMENT' | 'INQUIRY_REPLY' | 'SYSTEM';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showToast: (title: string, message: string, type?: ToastType, icon?: string) => void;
  fetchNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.isRead).length
  , [notifications]);

  const showToast = useCallback((title: string, message: string, type: ToastType = 'info', icon?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, icon }]);
    
    // 5초 후에 자동 삭제
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/api/v1/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error('알림 목록 가져오기 실패:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/v1/notifications/mark-all-read', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
      // 낙관적 업데이트 실패 시 원래대로 돌릴 수 있지만 간단히 로컬만 변경으로도 대응
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('알림 삭제 실패:', err);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      showToast, 
      fetchNotifications, 
      markAllAsRead, 
      deleteNotification,
      setNotifications 
    }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[3000] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <NotificationToast
              key={toast.id}
              {...toast}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
