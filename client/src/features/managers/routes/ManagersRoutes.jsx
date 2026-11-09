import React from 'react';
import ManagersPage from '../../landlord/ManagersPage';
import ProtectedRoute from '../../../app/routes/ProtectedRoute';

// Chỉ chủ trọ (landlord) được giao / gỡ quản lý
const managersRoutes = [
  {
    path: '/managers',
    element: (
      <ProtectedRoute roles={['landlord']}>
        <ManagersPage />
      </ProtectedRoute>
    ),
  },
];

export default managersRoutes;
