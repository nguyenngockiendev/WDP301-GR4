import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../shared/utils/auth';

export default function ProtectedRoute({ roles }) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return <h3 className="p-6">403 - Bạn không có quyền truy cập trang này</h3>;
  }
  return <Outlet context={{ user }} />;
}
