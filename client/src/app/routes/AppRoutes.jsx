import React from 'react';
import { Route, Routes } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import authRoutes from '../../features/auth/routes/AuthRoutes';
import homeRoutes from '../../features/home/routes/HomeRoutes';
import dashboardRoutes from '../../features/dashboard/routes/DashboardRoutes';
import profileRoutes from '../../features/profile/routes/ProfileRoutes';
import usersRoutes from '../../features/users/routes/UsersRoutes';
import buildingsRoutes from '../../features/buildings/routes/BuildingsRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import billingRoutes from '../../features/billing/routes/BillingRoutes';
import rentalSettingsRoutes from '../../features/rental-settings/routes/RentalSettingsRoutes';
import reportsRoutes from '../../features/reports/routes/ReportsRoutes';
import workspaceRoutes from '../../features/workspace/routes/WorkspaceRoutes';
import notificationsRoutes from '../../features/notifications/routes/NotificationsRoutes';

const featureRoutes = [
  ...dashboardRoutes,
  ...profileRoutes,
  ...usersRoutes,
  ...buildingsRoutes,
  ...roomsRoutes,
  ...contractsRoutes,
  ...billingRoutes,
  ...rentalSettingsRoutes,
  ...reportsRoutes,
  ...workspaceRoutes,
  ...notificationsRoutes,
];

export default function AppRoutes() {
  return (
    <Routes>
      {homeRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        {featureRoutes.map(route => (
          <Route
            key={route.path}
            path={route.path}
            element={<ProtectedRoute roles={route.roles}>{route.element}</ProtectedRoute>}
          />
        ))}
      </Route>

      <Route path="*" element={<h1>Page not found</h1>} />
    </Routes>
  );
}
