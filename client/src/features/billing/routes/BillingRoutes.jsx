import React from 'react';
import Billing from '../pages/Billing';

const billingRoutes = [
  { path: '/billing', element: <Billing />, roles: ['LANDLORD', 'MANAGER'] },
];

export default billingRoutes;
