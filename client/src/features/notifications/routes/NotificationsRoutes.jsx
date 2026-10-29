import { Navigate } from 'react-router-dom';
import NotificationsPage from '../pages/NotificationsPage';

function NotificationsRoute() {
  return localStorage.getItem('token') ? <NotificationsPage /> : <Navigate to="/login" replace />;
}
export default [{ path: '/notifications', element: <NotificationsRoute /> }];
