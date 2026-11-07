import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { notificationsAPI } from '../api/notifications-api';
import api from '../../../shared/api/axiosClient';

const Context = createContext(null);
export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(null);
  const [realtimeRevision, setRealtimeRevision] = useState(0);
  const [authenticated, setAuthenticated] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', sync);
    window.addEventListener('auth-changed', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('auth-changed', sync); };
  }, []);
  const refreshUnread = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) { setAuthenticated(false); setUnreadCount(null); return; }
    try {
      const response = await notificationsAPI.unread();
      if (localStorage.getItem('token') !== currentToken) return;
      setUnreadCount(response.data.unreadCount);
      setAuthenticated(true);
    } catch (error) {
      if (localStorage.getItem('token') !== currentToken) return;
      setUnreadCount(null);
      if (error.response?.status === 401) setAuthenticated(false);
    }
  }, []);
  useEffect(() => {
    let socket, retry;
    let disposed = false, attempts = 0;
    setUnreadCount(null);
    if (!token) { setAuthenticated(false); return; }
    setAuthenticated(null);
    const refresh = () => {
      if (disposed) return;
      refreshUnread();
      setRealtimeRevision(value => value + 1);
    };
    const connect = () => {
      if (disposed || localStorage.getItem('token') !== token) return;
      const url = new URL(api.defaults.baseURL, window.location.origin);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      url.pathname = `${url.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws/notifications`;
      url.search = '';
      const connection = new WebSocket(url);
      socket = connection;
      connection.onopen = () => {
        if (disposed) return connection.close();
        connection.send(JSON.stringify({ type: 'authenticate', token }));
      };
      connection.onmessage = event => {
        if (disposed) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ready') { attempts = 0; setAuthenticated(true); }
          if (['ready', 'notifications.changed'].includes(message.type)) refresh();
        } catch { /* Ignore malformed server messages. */ }
      };
      connection.onclose = event => {
        if (disposed) return;
        if (event.code === 4001) {
          if (localStorage.getItem('token') === token) {
            localStorage.removeItem('token');
            window.dispatchEvent(new Event('auth-changed'));
          }
          setAuthenticated(false); setUnreadCount(null); return;
        }
        retry = setTimeout(connect, Math.min(1000 * 2 ** Math.min(attempts++, 5), 30000));
      };
    };
    refresh(); connect();
    window.addEventListener('focus', refresh);
    return () => { disposed = true; clearTimeout(retry); socket?.close(); window.removeEventListener('focus', refresh); };
  }, [token, refreshUnread]);
  return <Context.Provider value={{ unreadCount, setUnreadCount, refreshUnread, realtimeRevision, authenticated }}>{children}</Context.Provider>;
}
export const useNotifications = () => useContext(Context);
