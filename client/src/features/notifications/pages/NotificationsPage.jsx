import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { notificationsAPI } from '../api/notifications-api';
import { useNotifications } from '../hooks/useNotifications';

const filters = [['all', 'Tất cả'], ['unread', 'Chưa đọc'], ['read', 'Đã đọc']];
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-surface-border px-4 py-2 text-sm font-semibold hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed';

export default function NotificationsPage() {
  const { unreadCount, setUnreadCount, refreshUnread } = useNotifications();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    setUnauthorized(false);
    notificationsAPI.list({ page, limit: 10, status }).then(response => {
      if (id !== requestId.current) return;
      const next = response.data;
      if (page > Math.max(1, next.totalPages)) {
        setPage(Math.max(1, next.totalPages));
        return;
      }
      setData(next);
      setUnreadCount(next.unreadCount);
    }).catch(err => {
      if (id !== requestId.current) return;
      setError(err.response?.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Không tải được thông báo. Vui lòng thử lại.');
      setUnauthorized(err.response?.status === 401);
    }).finally(() => {
      if (id === requestId.current) setLoading(false);
    });
    return () => { requestId.current++; };
  }, [page, status, revision, setUnreadCount]);

  async function markRead(id) {
    setBusy(true);
    setError('');
    try {
      if (id) await notificationsAPI.read(id);
      else await notificationsAPI.readAll();
      await refreshUnread();
      setRevision(value => value + 1);
    } catch (err) {
      setUnauthorized(err.response?.status === 401);
      setError(err.response?.status === 401 ? 'Vui lòng đăng nhập lại để tiếp tục.' : 'Chưa cập nhật được thông báo. Vui lòng thử lại.');
    } finally { setBusy(false); }
  }

  return (
    <section className="mx-auto max-w-5xl p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">HAVEN STAY</p>
          <h1 className="text-2xl font-bold text-content-main">Thông báo</h1>
          <p className="mt-2 text-sm text-content-sub">Theo dõi những cập nhật dành cho bạn.</p>
        </div>
        <button className={`${buttonClass} bg-gradient-emerald text-white`} disabled={busy || loading || !unreadCount || unauthorized} onClick={() => markRead()}>
          <CheckCheck size={18} /> Đánh dấu tất cả đã đọc
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border p-4">
          <div className="flex flex-wrap gap-2" aria-label="Lọc thông báo">
            {filters.map(([value, label]) => <button key={value} aria-pressed={status === value} disabled={busy}
              onClick={() => { setStatus(value); setPage(1); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${status === value ? 'bg-primary text-white' : 'text-content-sub hover:bg-primary-50'}`}>
              {label}{value === 'unread' && unreadCount != null ? ` (${unreadCount})` : ''}
            </button>)}
          </div>
          <button className={buttonClass} disabled={busy || loading} onClick={() => setRevision(value => value + 1)}><RefreshCw size={16} /> Làm mới</button>
        </div>
        {error && <div role="alert" className="m-4 rounded-xl border border-status-danger p-4 text-sm text-status-danger">{error}
          {unauthorized && <Link className="ml-2 font-bold underline" to="/login">Đăng nhập</Link>}
        </div>}
        {loading ? <p role="status" className="p-12 text-center text-content-sub">Đang tải thông báo…</p> : !error && data?.items.length === 0 ? (
          <div className="px-4 py-16 text-center text-content-sub"><Bell className="mx-auto mb-4 text-primary" size={36} /><h2 className="font-semibold text-content-main">{status === 'unread' ? 'Bạn đã đọc hết thông báo' : 'Chưa có thông báo'}</h2><p className="mt-2 text-sm">Các cập nhật dành cho bạn sẽ xuất hiện tại đây.</p></div>
        ) : !unauthorized && !loading && data && (
          <ul className="divide-y divide-surface-border">
            {data.items.map(item => <li key={item._id} className={`flex gap-3 p-4 sm:p-6 ${item.isRead ? '' : 'bg-primary-50'}`}>
              <Bell className="mt-1 shrink-0 text-primary" size={20} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-semibold text-content-main">{item.title}</h2>{!item.isRead && <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-dark">Chưa đọc</span>}</div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-content-sub">{item.content}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <time dateTime={item.createdAt} className="text-xs text-content-sub">{new Date(item.createdAt).toLocaleString('vi-VN')}</time>
                  {!item.isRead && <button disabled={busy} onClick={() => markRead(item._id)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline disabled:opacity-50"><Check size={16} /> Đánh dấu đã đọc</button>}
                </div>
              </div>
            </li>)}
          </ul>
        )}
        {!loading && !error && data?.total > 0 && <nav aria-label="Phân trang thông báo" className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border p-4 text-sm text-content-sub">
          <span>{data.total} thông báo · Trang {page}/{data.totalPages}</span>
          <div className="flex gap-2"><button className={buttonClass} disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>Trước</button><button className={buttonClass} disabled={page >= data.totalPages || busy} onClick={() => setPage(page + 1)}>Sau</button></div>
        </nav>}
      </div>
    </section>
  );
}
