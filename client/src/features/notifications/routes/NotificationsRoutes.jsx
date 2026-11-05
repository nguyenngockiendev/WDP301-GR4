import { Navigate } from 'react-router-dom';
import NotificationsPage from '../pages/NotificationsPage';
import ManageNotificationsPage from '../pages/ManageNotificationsPage';
import { useNotifications } from '../hooks/useNotifications';

function NotificationsRoute({ manage = false }) {
  const { authenticated } = useNotifications();
  if (authenticated === null)
    return (
      <p role="status" className="p-8">
        Đang kiểm tra phiên đăng nhập…
      </p>
    );
  return authenticated ? (
    manage ? (
      <ManageNotificationsPage />
    ) : (
      <NotificationsPage />
    )
  ) : (
    <Navigate to="/login" replace />
  );
}
export default [
  { path: '/notifications', element: <NotificationsRoute /> },
  { path: '/notifications/manage', element: <NotificationsRoute manage /> },
];
