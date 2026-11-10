import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/dashboard-api';
import ManagerDashboard from '../components/ManagerDashboard';
import TenantDashboard from '../components/TenantDashboard';
import { useNotifications } from '../../notifications/hooks/useNotifications';
import { getCurrentUser } from '../../../shared/utils/auth';

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [propertyId, setPropertyId] = useState(
    () => localStorage.getItem('currentPropertyId') || '',
  );
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const { realtimeRevision } = useNotifications();
  useEffect(() => {
    const syncProperty = () => setPropertyId(localStorage.getItem('currentPropertyId') || '');
    window.addEventListener('property-changed', syncProperty);
    window.addEventListener('storage', syncProperty);
    return () => {
      window.removeEventListener('property-changed', syncProperty);
      window.removeEventListener('storage', syncProperty);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      setErrorStatus(null);
      try {
        const filters = { days };
        if (propertyId && getCurrentUser()?.role !== 'tenant') filters.propertyId = propertyId;
        const result = await getDashboard(filters, controller.signal);
        if (!controller.signal.aborted) setDashboard(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        setDashboard(null);
        setError(error.response?.data?.message || 'Không tải được dashboard. Vui lòng thử lại.');
        setErrorStatus(error.response?.status);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => controller.abort();
  }, [propertyId, days, refreshCount, realtimeRevision]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">HAVEN STAY</p>
          <h1 className="mt-2 text-2xl font-bold">
            {dashboard?.user.role === 'tenant' ? 'Không gian của tôi' : 'Tổng quan nhà trọ'}
          </h1>
          {dashboard && (
            <p className="mt-2 text-sm text-content-sub">
              Xin chào, {dashboard.user.fullName}. Cập nhật lúc{' '}
              {new Date(dashboard.generatedAt).toLocaleTimeString('vi-VN')}.
            </p>
          )}
        </div>
        <button
          disabled={loading}
          onClick={() => setRefreshCount(value => value + 1)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          Làm mới
        </button>
      </div>
      {loading && (
        <p role="status" className="rounded-2xl bg-surface-card p-8 text-content-sub">
          Đang tải dữ liệu…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-status-danger bg-surface-card p-6 text-status-danger"
        >
          {error}
          {errorStatus === 401 && (
            <Link to="/login" className="ml-3 underline">
              Đăng nhập lại
            </Link>
          )}
          {propertyId && errorStatus === 403 && (
            <button className="ml-3 underline" onClick={() => setPropertyId('')}>
              Về các nhà trọ được phép xem
            </button>
          )}
        </div>
      )}
      {!loading &&
        dashboard &&
        (dashboard.user.role === 'tenant' ? (
          <TenantDashboard dashboard={dashboard} />
        ) : (
          <ManagerDashboard
            dashboard={dashboard}
            propertyId={propertyId}
            days={days}
            onPropertyChange={setPropertyId}
            onDaysChange={setDays}
          />
        ))}
      {!loading && dashboard && (
        <div className="rounded-3xl border border-surface-border bg-surface-card p-6 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Thông báo gần đây</h2>
            <Link to="/notifications" className="text-sm font-semibold text-primary">
              Xem tất cả · {dashboard.unreadCount} chưa đọc
            </Link>
          </div>
          {dashboard.notifications.length === 0 ? (
            <p className="text-sm text-content-sub">Bạn chưa có thông báo.</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {dashboard.notifications.map(notification => (
                <li key={notification._id} className="py-3">
                  <Link to="/notifications" className="font-semibold hover:text-primary">
                    {notification.title}
                  </Link>
                  {!notification.isRead && (
                    <span className="ml-2 text-xs text-primary">Chưa đọc</span>
                  )}
                  <p className="mt-1 break-words text-sm text-content-sub">
                    {notification.content}
                  </p>
                  <p className="mt-1 text-xs text-content-muted">
                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
