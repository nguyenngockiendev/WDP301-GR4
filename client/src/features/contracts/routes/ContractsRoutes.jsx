import React from 'react';
import ManageContracts from '../pages/ManageContracts';
import MySigningContracts from '../pages/MySigningContracts';
import ContractSigningPage from '../pages/ContractSigningPage';
import ProtectedRoute from '../../../app/routes/ProtectedRoute';

const contractsRoutes = [
  { path: '/contracts/my', element: <ProtectedRoute roles={['tenant']}><MySigningContracts /></ProtectedRoute> },
  { path: '/contracts/:contractId/signing', element: <ProtectedRoute roles={['tenant', 'manager', 'landlord']}><ContractSigningPage /></ProtectedRoute> },
  {
    path: '/properties/:propertyId/contracts',
    element: <ManageContracts />,
  },
];

export default contractsRoutes;
