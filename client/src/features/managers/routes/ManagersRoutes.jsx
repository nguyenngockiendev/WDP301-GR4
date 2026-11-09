import React from 'react';
import ManageManagers from '../pages/ManageManagers';
import ProtectedRoute from '../../../app/routes/ProtectedRoute';

// Chỉ chủ trọ (landlord) được giao / gỡ quản lý
const managersRoutes = [
  {
    path: '/managers',
    element: (
      <ProtectedRoute roles={['landlord']}>
        <ManageManagers />
      </ProtectedRoute>
    ),
  },
];

export default managersRoutes;
