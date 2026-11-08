import React from 'react';
import ManageTemplates from '../pages/ManageTemplates';
import ProtectedRoute from '../../../app/routes/ProtectedRoute';

// Chỉ chủ trọ (landlord) được tạo / sửa mẫu hợp đồng
const templatesRoutes = [
  {
    path: '/contract-templates',
    element: (
      <ProtectedRoute roles={['landlord']}>
        <ManageTemplates />
      </ProtectedRoute>
    ),
  },
];

export default templatesRoutes;
