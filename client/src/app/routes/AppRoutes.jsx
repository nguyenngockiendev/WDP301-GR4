import Profile from '../../features/profile/pages/Profile';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { authRoutes } from '../../features/auth/routes/AuthRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import BrowseRooms from '../../features/rooms/pages/BrowseRooms';
import RoomDetail from '../../features/rooms/pages/RoomDetail';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import ReportsPage from '../../features/reports/ReportsPage';
import notificationsRoutes from '../../features/notifications/routes/NotificationsRoutes';
import shortcuts from '../../features/properties/routes/RentalsRoutes';
import terminationRequestsRoutes from '../../features/terminationrequests/routes/TerminationRequestsRoutes';
import managerTerminationRequestsRoutes from '../../features/terminationrequests/routes/ManagerTerminationRequestsRoutes';
import templatesRoutes from '../../features/templates/routes/TemplatesRoutes';
import managersRoutes from '../../features/managers/routes/ManagersRoutes';
import SettingsPage from '../../features/landlord/SettingsPage';
import utilityReadingsRoutes from '../../features/utility-readings/routes/UtilityReadingsRoutes';
import invoiceRoutes from '../../features/invoices/routes/InvoiceRoutes';
import PropertiesHome from '../../features/landlord/PropertiesHome';
import PropertyOperationsPage from '../../features/landlord/PropertyOperationsPage';
// Dashboard hiển thị dữ liệu theo vai trò của tài khoản đang đăng nhập.
function DashboardEntry() {
  return <DashboardPage />;
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
    ...invoiceRoutes,
  ];
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/browse-rooms" element={<BrowseRooms />} />
      <Route path="/rooms/:roomId" element={<RoomDetail />} />

      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardEntry />} />
          <Route
            path="properties"
            element={
              <ProtectedRoute roles={['landlord', 'manager']}>
                <PropertiesHome />
              </ProtectedRoute>
            }
          />
          <Route path="properties/:propertyId/operations" element={<ProtectedRoute roles={['landlord', 'manager']}><PropertyOperationsPage /></ProtectedRoute>} />
          <Route
            path="settings"
            element={
              <ProtectedRoute roles={['landlord']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="reports" element={<ReportsPage />} />
          {routes.filter(route => !['/browse-rooms', '/rooms/:roomId'].includes(route.path)).map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
    </Routes>
  );
}
