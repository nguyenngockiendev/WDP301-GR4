import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import { authRoutes } from '../../features/auth/routes/AuthRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import ProtectedRoute from './ProtectedRoute';
import PropertiesHome from '../../features/landlord/PropertiesHome';
import ManagersPage from '../../features/landlord/ManagersPage';
import SettingsPage from '../../features/landlord/SettingsPage';
import HomePage from '../../features/home/HomePage';
import PropertyOperationsPage from '../../features/landlord/PropertyOperationsPage';

export default function AppRoutes() {
  const protectedRoutes = [...roomsRoutes, ...contractsRoutes, ...rentalsRoutes, ...tenantsRoutes]
    .filter(route => route.path !== '/browse-rooms');
  const publicRoomsRoute = roomsRoutes.find(route => route.path === '/browse-rooms');

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      {publicRoomsRoute && <Route path={publicRoomsRoute.path} element={publicRoomsRoute.element} />}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<ProtectedRoute roles={['landlord', 'manager']} />}>
            <Route path="/properties" element={<PropertiesHome />} />
          </Route>
          <Route element={<ProtectedRoute roles={['landlord']} />}>
            <Route path="/managers" element={<ManagersPage />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<ProtectedRoute roles={['landlord', 'manager']} />}>
            <Route path="/properties/:propertyId/operations" element={<PropertyOperationsPage />} />
          </Route>
          {protectedRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
    </Routes>
  );
}
