import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import api from '../../shared/api/axiosClient';

export default function ProtectedRoute({ roles }) {
  const location = useLocation();
  const parentContext = useOutletContext();
  const inheritedUser = parentContext?.user || null;
  const [state, setState] = useState({ loading: !inheritedUser, user: inheritedUser });

  useEffect(() => {
    if (inheritedUser) {
      setState({ loading: false, user: inheritedUser });
      return undefined;
    }
    let active = true;
    api.get('/auth/me')
      .then(response => {
        if (active) setState({ loading: false, user: response.data?.user || null });
      })
      .catch(() => {
        if (active) setState({ loading: false, user: null });
      });
    return () => { active = false; };
  }, [inheritedUser]);

  if (state.loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Đang kiểm tra phiên đăng nhập…</div>;
  }
  if (!state.user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(state.user.role)) {
    return <h3 className="p-6">403 - Bạn không có quyền truy cập trang này</h3>;
  }
  return <Outlet context={{ user: state.user }} />;
}
