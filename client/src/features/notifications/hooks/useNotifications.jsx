import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../api/notifications-api';

const Context = createContext(null);
export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(null);
  const refreshUnread = useCallback(async () => {
    if (!localStorage.getItem('token')) return setUnreadCount(null);
    try {
      const response = await notificationsAPI.unread();
      setUnreadCount(response.data.unreadCount);
    } catch {
      setUnreadCount(null);
    }
  }, []);
  useEffect(() => {
    refreshUnread();
    const refresh = () => { if (!document.hidden) refreshUnread(); };
    const interval = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [refreshUnread]);
  return <Context.Provider value={{ unreadCount, setUnreadCount, refreshUnread }}>{children}</Context.Provider>;
}
export const useNotifications = () => useContext(Context);
