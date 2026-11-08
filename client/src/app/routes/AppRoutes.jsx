import Profile from '../../features/profile/pages/Profile';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { getCurrentUser } from '../../shared/utils/auth';
import { authRoutes } from '../../features/auth/routes/AuthRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import notificationsRoutes from '../../features/notifications/routes/NotificationsRoutes';
import shortcuts from '../../features/properties/routes/RentalsRoutes';
import terminationRequestsRoutes from '../../features/terminationrequests/routes/TerminationRequestsRoutes';
import managerTerminationRequestsRoutes from '../../features/terminationrequests/routes/ManagerTerminationRequestsRoutes';
import templatesRoutes from '../../features/templates/routes/TemplatesRoutes';
import managersRoutes from '../../features/managers/routes/ManagersRoutes';
import utilityReadingsRoutes from '../../features/utility-readings/routes/UtilityReadingsRoutes';
// Người thuê không dùng trang quản lý: /dashboard chuyển về trang Home
function DashboardEntry() {
  return getCurrentUser()?.role === 'tenant' ? <Navigate to="/home" replace /> : <DashboardPage />;
}

export default function AppRoutes() {
  const routes = [
    ...roomsRoutes,
    ...contractsRoutes,
    ...rentalsRoutes,
    ...tenantsRoutes,
    ...notificationsRoutes,
    ...shortcuts,
    ...terminationRequestsRoutes,
    ...managerTerminationRequestsRoutes,
    ...templatesRoutes,
    ...managersRoutes,
    ...utilityReadingsRoutes,
  ];
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />

      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardEntry />} />
          {routes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
    </Routes>
  );
}
