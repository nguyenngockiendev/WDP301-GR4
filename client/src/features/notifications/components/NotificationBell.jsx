import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../api/notifications-api';
import { useNotifications } from '../hooks/useNotifications';

const formatDate = value =>
  new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
export default function NotificationBell() {
  const { unreadCount, setUnreadCount, refreshUnread, realtimeRevision } = useNotifications();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all');
  const [pages, setPages] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const root = useRef(null);
  const bell = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (new URLSearchParams(location.search).get('notifications') === 'open') {
      setOpen(true);
      const params = new URLSearchParams(location.search);
      params.delete('notifications');
      navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!open) return;
    const outside = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        bell.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    const fetchNotifications = async () => {
      try {
        // Tải lại các trang đang xem để realtime không làm mất hoặc lặp thông báo.
        const responses = await Promise.all(
          Array.from({ length: pages }, (_, index) =>
            notificationsAPI.list({ page: index + 1, limit: 10, status }),
          ),
        );
        if (!active) return;
        const unique = new Map();
        for (const response of responses)
          for (const item of response.data.items) unique.set(item._id, item);
        setItems([...unique.values()]);
        setTotalPages(responses[0].data.totalPages);
        setUnreadCount(responses[0].data.unreadCount);
      } catch (error) {
        if (active)
          setError(
            error.response?.status === 401
              ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
              : 'Chưa tải được thông báo. Vui lòng thử lại.',
          );
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchNotifications();
    return () => {
      active = false;
    };
  }, [open, pages, status, realtimeRevision, revision, setUnreadCount]);

  const readNotification = async item => {
    if (busy) return;
    setError('');
    if (item.isRead) return;
    setBusy(true);
    try {
      const response = await notificationsAPI.read(item._id);
      setItems(current => current.map(value => (value._id === item._id ? response.data : value)));
      await refreshUnread();
      setRevision(value => value + 1);
    } catch {
      setError('Chưa đánh dấu được đã đọc. Vui lòng bấm lại thông báo để thử lại.');
    } finally {
      setBusy(false);
    }
  };
  const readAll = async () => {
    setBusy(true);
    setError('');
    try {
      await notificationsAPI.readAll();
      await refreshUnread();
      setRevision(value => value + 1);
    } catch {
      setError('Chưa đánh dấu được đã đọc. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={bell}
        type="button"
        aria-label={`Thông báo${unreadCount == null ? '' : `, ${unreadCount} chưa đọc`}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => {
          setOpen(value => !value);
          if (!open) setPages(1);
        }}
        className="relative inline-flex rounded-xl p-3 text-primary hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Bell size={22} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-xs font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section
          id="notification-panel"
          aria-label="Bảng thông báo"
          className="fixed left-3 right-3 top-20 z-50 flex max-h-[75dvh] flex-col overflow-hidden rounded-2xl border border-surface-border bg-white shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[420px]"
        >
          <div className="flex items-center justify-between border-b border-surface-border p-4">
            <h2 className="text-lg font-bold">Thông báo</h2>
            <button
              aria-label="Đóng bảng thông báo"
              onClick={() => {
                setOpen(false);
                bell.current?.focus();
              }}
              className="rounded-lg p-2 hover:bg-primary-50"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-surface-border p-3">
            {[
              ['all', 'Tất cả'],
              ['unread', 'Chưa đọc'],
              ['read', 'Đã đọc'],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value);
                  setPages(1);
                }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${status === value ? 'bg-primary text-white' : 'text-content-sub hover:bg-primary-50'}`}
              >
                {label}
              </button>
            ))}
            <button
              disabled={busy || !unreadCount}
              onClick={readAll}
              className="ml-auto text-xs font-semibold text-primary disabled:opacity-40"
            >
              Đọc tất cả
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            {error && (
              <div role="alert" className="p-4 text-sm text-red-700">
                {error}
                <button onClick={() => setRevision(value => value + 1)} className="ml-2 underline">
                  Thử lại
                </button>
              </div>
            )}
            {!loading && !error && !items.length && (
              <p className="p-8 text-center text-sm text-content-sub">
                {status === 'unread' ? 'Bạn đã đọc hết thông báo.' : 'Chưa có thông báo.'}
              </p>
            )}
            <ul className="divide-y divide-surface-border">
              {items.map(item => (
                <li key={item._id}>
                  <button
                    disabled={busy}
                    onClick={() => readNotification(item)}
                    className={`flex w-full gap-3 p-4 text-left hover:bg-primary-50 disabled:opacity-60 ${item.isRead ? '' : 'bg-primary/5'}`}
                  >
                    <span
                      className={`mt-2 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-primary'}`}
                      aria-label={item.isRead ? 'Đã đọc' : 'Chưa đọc'}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words font-semibold">{item.title}</span>
                      <span className="mt-1 block whitespace-pre-wrap break-words text-sm text-content-sub">
                        {item.content}
                      </span>
                      <time
                        className="mt-2 block text-xs text-content-sub"
                        dateTime={item.createdAt}
                      >
                        {formatDate(item.createdAt)}
                      </time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {loading && (
              <p role="status" className="p-4 text-center text-sm text-content-sub">
                Đang tải thông báo…
              </p>
            )}
          </div>
          {pages < totalPages && (
            <button
              disabled={loading || !!error}
              onClick={() => setPages(value => value + 1)}
              className="shrink-0 border-t border-surface-border p-3 text-sm font-semibold text-primary disabled:opacity-40"
            >
              Hiện thêm thông báo
            </button>
          )}
        </section>
      )}
    </div>
  );
}
