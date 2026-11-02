import React from 'react';
import Reports from '../pages/Reports';

const reportsRoutes = [
  { path: '/reports', element: <Reports type="revenue" />, roles: ['LANDLORD'] },
  { path: '/reports/revenue', element: <Reports type="revenue" />, roles: ['LANDLORD'] },
  { path: '/reports/outstanding', element: <Reports type="outstanding" />, roles: ['LANDLORD'] },
  { path: '/reports/occupancy', element: <Reports type="occupancy" />, roles: ['LANDLORD'] },
];

export default reportsRoutes;
