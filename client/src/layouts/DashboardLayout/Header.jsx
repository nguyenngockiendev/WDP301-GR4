import HeaderSearch from './HeaderSearch';
import React from 'react';
import { Plus, ChevronDown, LogOut } from 'lucide-react';
import NotificationBell from '../../features/notifications/components/NotificationBell';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../../shared/api/axiosClient';
import { clearAuth, getCurrentUser } from '../../shared/utils/auth';
import { useNotifications } from '../../features/notifications/hooks/useNotifications';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const canManage = ['landlord', 'manager'].includes(user?.role);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyError, setPropertyError] = useState('');
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem('currentPropertyId') || '',
  );
  const routePropertyId = location.pathname.match(/^\/properties\/([^/]+)\//)?.[1];

  useEffect(() => {
    if (!canManage) {
      setLoadingProperties(false);
      return;
    }
    const controller = new AbortController();
    setLoadingProperties(true);
    setPropertyError('');
    api
      .get('/properties/my', { signal: controller.signal })
      .then(response => {
        if (controller.signal.aborted) return;
        const list = response.data || [];
        setProperties(list);
        setSelectedId(current =>
          list.some(p => p._id === current) ? current : list[0]?._id || '',
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setPropertyError('Không tải được nhà trọ');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProperties(false);
      });
    return () => controller.abort();
  }, [canManage, user?.userId, retry]);

  useEffect(() => {
    if (loadingProperties || propertyError || !canManage) return;
    const chosenId = properties.some(p => p._id === routePropertyId) ? routePropertyId : selectedId;
    if (chosenId) {
      setSelectedId(chosenId);
      localStorage.setItem('currentPropertyId', chosenId);
      window.dispatchEvent(new Event('property-changed'));
    } else localStorage.removeItem('currentPropertyId');
  }, [routePropertyId, selectedId, properties, loadingProperties, propertyError, canManage]);

  const selectProperty = event => {
    const id = event.target.value;
    if (!properties.some(p => p._id === id)) return;
    setSelectedId(id);
    localStorage.setItem('currentPropertyId', id);
    window.dispatchEvent(new Event('property-changed'));
    if (location.pathname === '/dashboard') return;
    const section =
      location.pathname.match(
        /^\/properties\/[^/]+\/(rooms|contracts|rental-requests|tenants|operations)$/,
      )?.[1] || 'rooms';
    navigate('/properties/' + id + '/' + section);
  };
  const { authenticated } = useNotifications();
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    try {
      clearAuth();
      window.dispatchEvent(new Event('auth-changed'));
      navigate('/login');
    } catch {
      setLogoutError('Chưa đăng xuất được. Vui lòng thử lại.');
    }
  };

  return (
    <header className="h-20 bg-white/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 border-b border-emerald-100/40">
      {/* Chỉ hiển thị những nhà trọ tài khoản có quyền quản lý. */}
      {canManage && location.pathname !== '/reports' ? (
        <div className="flex items-center gap-2 min-w-0">
          {propertyError ? (
            <div role="alert" className="text-xs text-red-600">
              {propertyError}
              <button type="button" onClick={() => setRetry(n => n + 1)} className="ml-2 underline">
                Thử lại
              </button>
            </div>
          ) : (
            <div className="relative min-w-0">
              <select
                aria-label="Chọn nhà trọ"
                value={
                  properties.some(p => p._id === routePropertyId) ? routePropertyId : selectedId
                }
                onChange={selectProperty}
                disabled={loadingProperties || !properties.length}
                className="max-w-sm appearance-none pl-4 pr-10 py-2.5 rounded-2xl bg-white/80 border border-emerald-100/80 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-default"
              >
                {loadingProperties ? (
                  <option value="">Đang tải nhà trọ...</option>
                ) : !properties.length ? (
                  <option value="">
                    {user?.role === 'manager' ? 'Chưa được giao nhà trọ' : 'Chưa có nhà trọ'}
                  </option>
                ) : (
                  properties.map(property => (
                    <option key={property._id} value={property._id}>
                      {property.name} — {property.address}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          )}
        </div>
      ) : (
        <span className="text-sm font-bold text-slate-800">
          {location.pathname === '/reports'
            ? user?.role === 'manager'
              ? 'Báo cáo tháng'
              : 'Báo cáo tháng · Chọn dãy trọ bên dưới'
            : 'HavenStay'}
        </span>
      )}

      {/* Khối bên phải: Tìm kiếm, Thông báo, Nút tạo HĐ, Đăng xuất */}
      <div className="flex items-center gap-3.5">
        {canManage && location.pathname !== '/reports' && (
          <HeaderSearch
            propertyId={
              !loadingProperties && !propertyError
                ? properties.some(p => p._id === routePropertyId)
                  ? routePropertyId
                  : selectedId
                : ''
            }
          />
        )}

        {/* Nút Chuông */}
        {authenticated && <NotificationBell />}
        {logoutError && (
          <span role="alert" className="text-sm text-status-danger">
            {logoutError}
          </span>
        )}

        {/* Nút Tạo Hợp Đồng Mới (Xanh Emerald Gradient) */}
        {user?.role === 'manager' && (
          <button
            disabled={loadingProperties || !!propertyError || !selectedId}
            onClick={() =>
              navigate('/properties/' + (routePropertyId || selectedId) + '/contracts?create=1')
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition cursor-pointer"
          >
            <Plus size={16} className="stroke-[3]" />
            <span>Tạo Hợp Đồng Mới</span>
          </button>
        )}

        {/* Nút Đăng xuất */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md border border-emerald-100/80 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition shadow-xs cursor-pointer ml-1"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
