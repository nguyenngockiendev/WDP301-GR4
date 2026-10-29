import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import authRoutes from '../../features/auth/routes/authRoutes';
import roomsRoutes from '../../features/rooms/routes/RoomsRoutes';
import contractsRoutes from '../../features/contracts/routes/ContractsRoutes';
import rentalsRoutes from '../../features/rentals/routes/RentalsRoutes';
import tenantsRoutes from '../../features/tenants/routes/TenantsRoutes';
import notificationsRoutes from '../../features/notifications/routes/NotificationsRoutes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={'#'} />

      {authRoutes.map(route => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route>
          <Route
            path="dashboard"
            element={
              <div className="card p-4 shadow-sm border-0">
                <h2>Dashboard</h2>
                <p className="text-muted mb-0">
                  Chào mừng! Đây là trang mẫu sau khi đăng nhập. Các thành viên gắn route của
                  feature mới vào <code>src/app/routes/AppRoutes.jsx</code>.
                </p>
              </div>
            }
          />

          {roomsRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {contractsRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {rentalsRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}

          {tenantsRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
          {notificationsRoutes.map(route => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>

        <Route path="*" element={<h3>404 - Không tìm thấy trang</h3>} />
      </Route>
    </Routes>
  );
}
