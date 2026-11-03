import React from 'react';
import ManageContracts from '../pages/ManageContracts';

const contractsRoutes = [
  {
    path: '/properties/:propertyId/contracts',
    element: <ManageContracts />,
  },
];

export default contractsRoutes;
