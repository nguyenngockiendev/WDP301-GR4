import React from 'react';
import NewContract from '../pages/NewContract';

const contractsRoutes = [
  {
    path: '/contracts/new',
    element: <NewContract />,
    roles: ['LANDLORD'],
  },
];

export default contractsRoutes;
