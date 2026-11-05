import { Navigate } from 'react-router-dom';
import NotificationsPage from '../pages/NotificationsPage';
import { useNotifications } from '../hooks/useNotifications';

function NotificationsRoute() {
  const { authenticated } = useNotifications();
  if (authenticated === null) return <p role="status" className="p-8">Đang kiểm tra phiên đăng nhập…</p>;
  return authenticated ? <NotificationsPage /> : <Navigate to="/login" replace />;
}
export default [{ path: '/notifications', element: <NotificationsRoute /> }];
