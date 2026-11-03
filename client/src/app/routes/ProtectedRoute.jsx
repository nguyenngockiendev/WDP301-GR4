
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import api from '../../shared/api/axiosClient';

export default function ProtectedRoute() {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => {
    let active = true;
    api.get('/auth/me')
      .then(response => active && setState({ loading: false, user: response.data?.user || null }))
      .catch(() => active && setState({ loading: false, user: null }));
    return () => { active = false; };
  }, []);
  if (state.loading) return <div className="min-h-screen grid place-items-center text-slate-500">Đang kiểm tra phiên đăng nhập…</div>;
  if (!state.user) return <Navigate to="/login" replace />;
  return <Outlet context={{ user: state.user }} />;
}
