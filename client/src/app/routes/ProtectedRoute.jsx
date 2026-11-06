import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../shared/utils/auth';

/**
 * Bọc các route cần đăng nhập. Truyền `roles` để giới hạn theo vai trò.
 */
export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <h3 className="p-6">403 - Bạn không có quyền truy cập trang này</h3>;
  }
  return children ?? <Outlet />;
}
