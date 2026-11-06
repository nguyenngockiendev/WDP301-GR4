import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import { authRoutes } from '../../features/auth/routes/AuthRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import PropertyRedirect from '../../features/properties/pages/PropertyRedirect';
import { getCurrentUser } from '../../shared/utils/auth';

// Menu ngắn -> tự chuyển tới /properties/:propertyId/<section> của landlord
const shortcutRoutes = [
  { path: '/rooms', section: 'rooms' },
  { path: '/contracts', section: 'contracts' },
  { path: '/rental-requests', section: 'rental-requests' },
  { path: '/tenants', section: 'tenants' },
];

export default function AppRoutes() {
  const routes = [...roomsRoutes, ...contractsRoutes, ...rentalsRoutes, ...tenantsRoutes];
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={getCurrentUser() ? '/dashboard' : '/login'} replace />}
      />

      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />

          {shortcutRoutes.map(r => (
            <Route key={r.path} path={r.path} element={<PropertyRedirect section={r.section} />} />
          ))}

          {routes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
    </Routes>
  );
}
