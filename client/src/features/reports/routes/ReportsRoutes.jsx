import React from 'react';
import Reports from '../pages/Reports';

const reportsRoutes = [
  { path: '/reports', element: <Reports type="revenue" />, roles: ['LANDLORD', 'MANAGER'] },
  { path: '/reports/revenue', element: <Reports type="revenue" />, roles: ['LANDLORD', 'MANAGER'] },
  { path: '/reports/outstanding', element: <Reports type="outstanding" />, roles: ['LANDLORD', 'MANAGER'] },
  { path: '/reports/occupancy', element: <Reports type="occupancy" />, roles: ['LANDLORD', 'MANAGER'] },
];

export default reportsRoutes;
