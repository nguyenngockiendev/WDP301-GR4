import React from 'react';
import ManagerCheckoutRequests from '../pages/ManagerCheckoutRequests';
import ManagerCheckoutRequestDetail from '../pages/ManagerCheckoutRequestDetail';
const managerTerminationRequestsRoutes = [
  { path: '/manager/checkout-requests', element: <ManagerCheckoutRequests /> },
  { path: '/manager/checkout-requests/:id', element: <ManagerCheckoutRequestDetail /> },
];
export default managerTerminationRequestsRoutes;
