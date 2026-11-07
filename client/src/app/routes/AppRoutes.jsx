import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { authRoutes } from '../../features/auth/routes/AuthRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import notificationsRoutes from '../../features/notifications/routes/NotificationsRoutes';
import propertyShortcuts from '../../features/properties/routes/RentalsRoutes';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import PropertiesHome from '../../features/landlord/PropertiesHome';
import ManagersPage from '../../features/landlord/ManagersPage';
import SettingsPage from '../../features/landlord/SettingsPage';
import HomePage from '../../features/home/HomePage';
import PropertyOperationsPage from '../../features/landlord/PropertyOperationsPage';

export default function AppRoutes() {
  const nestedRoutes = [
    ...roomsRoutes.filter(route => route.path !== '/browse-rooms'),
    ...contractsRoutes,
    ...rentalsRoutes,
    ...tenantsRoutes,
    ...notificationsRoutes,
    ...propertyShortcuts,
  ];

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      {roomsRoutes.filter(route => route.path === '/browse-rooms').map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<ProtectedRoute roles={['landlord', 'manager']} />}>
            <Route path="/properties" element={<PropertiesHome />} />
            <Route path="/properties/:propertyId/operations" element={<PropertyOperationsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['landlord']} />}>
            <Route path="/managers" element={<ManagersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          {nestedRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
    </Routes>
  );
}
