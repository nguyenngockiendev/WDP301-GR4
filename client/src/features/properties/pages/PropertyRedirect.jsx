import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import propertiesAPI from '../api/properties-api';
import { getCurrentUser } from '../../../shared/utils/auth';

/**
 * Dùng cho các menu như /rooms, /contracts...: lấy nhà trọ của landlord đang đăng nhập
 * rồi chuyển tới /properties/:propertyId/<section>.
 */
export default function PropertyRedirect({ section }) {
  const [state, setState] = useState({ loading: true, propertyId: null, error: null });

  useEffect(() => {
    let cancelled = false;
    propertiesAPI
      .getMyProperties()
      .then(res => {
        if (cancelled) return;
        const list = res?.data || [];
        const saved = localStorage.getItem('currentPropertyId');
        const chosen = list.find(p => p._id === saved) || list[0];
        if (chosen) localStorage.setItem('currentPropertyId', chosen._id);
        setState({ loading: false, propertyId: chosen?._id || null, error: null });
      })
      .catch(err => {
        if (cancelled) return;
        setState({
          loading: false,
          propertyId: null,
          error: err.response?.data?.message || 'Không tải được danh sách nhà trọ',
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) return <p className="p-6 text-slate-500">Đang tải...</p>;
  if (state.propertyId) {
    return <Navigate to={`/properties/${state.propertyId}/${section}`} replace />;
  }
  return (
    <div className="p-6 text-slate-600">
      {state.error ||
        (getCurrentUser()?.role === 'manager'
          ? 'Bạn chưa được giao quản lý nhà trọ nào. Vui lòng liên hệ chủ trọ.'
          : 'Bạn chưa có nhà trọ nào. Hãy tạo nhà trọ trước khi quản lý.')}
    </div>
  );
}
