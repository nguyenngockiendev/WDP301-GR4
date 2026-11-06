import React from 'react';
import ProcessRentalRequests from '../pages/ProcessRentalRequests';
import SubmitRentalRequest from '../pages/SubmitRentalRequest';

const rentalsRoutes = [
  {
    path: '/properties/:propertyId/rental-requests',
    element: <ProcessRentalRequests />,
  },
  {
    path: '/rooms/:roomId/rental-request',
    element: <SubmitRentalRequest />,
  },
];

export default rentalsRoutes;
