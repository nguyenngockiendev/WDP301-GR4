import React from 'react';
import ManageTenants from '../pages/ManageTenants';

const tenantsRoutes = [
  {
    path: '/properties/:propertyId/tenants',
    element: <ManageTenants />,
  },
];

export default tenantsRoutes;
