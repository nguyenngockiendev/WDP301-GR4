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

  const isTenant = (dashboard?.user.role ?? getCurrentUser()?.role) === 'tenant';
  const refresh = () => setRefreshCount(value => value + 1);

  return (
    <section className={`mx-auto space-y-6 py-6 ${isTenant ? 'max-w-6xl sm:py-8' : 'max-w-7xl'}`}>
      {isTenant ? <TenantDashboard dashboard={dashboard} loading={loading} onRefresh={refresh} /> : (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">HAVEN STAY</p>
          <h1 className="mt-2 text-2xl font-bold">Tổng quan nhà trọ</h1>
          {dashboard && (
            <p className="mt-2 text-sm text-content-sub">
              Xin chào, {dashboard.user.fullName}. Cập nhật lúc{' '}
              {new Date(dashboard.generatedAt).toLocaleTimeString('vi-VN')}.
            </p>
          )}
        </div>
        <button
          disabled={loading}
          onClick={refresh}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          Làm mới
        </button>
      </div>
      )}
      {loading && (!isTenant || !dashboard) && (
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
      {!loading && dashboard && !isTenant && (
          <ManagerDashboard
            dashboard={dashboard}
            propertyId={propertyId}
            days={days}
            onPropertyChange={setPropertyId}
            onDaysChange={setDays}
          />
      )}
    </section>
  );
}
