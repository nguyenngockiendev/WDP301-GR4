import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import authRoutes from '../../features/auth/routes/authRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';
import PropertiesPage from '../../features/landlord/PropertiesPage';
import ManagersPage from '../../features/landlord/ManagersPage';
import SettingsPage from '../../features/landlord/SettingsPage';
import ProfilePage from '../../features/auth/pages/ProfilePage';

export default function AppRoutes() {
  const routes = [...roomsRoutes, ...contractsRoutes, ...rentalsRoutes, ...tenantsRoutes];
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="managers" element={<ManagersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {routes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
    </Routes>
  );
}
