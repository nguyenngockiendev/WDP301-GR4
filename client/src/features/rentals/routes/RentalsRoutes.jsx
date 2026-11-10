import React from 'react';
import ProcessRentalRequests from '../pages/ProcessRentalRequests';
import SubmitRentalRequest from '../pages/SubmitRentalRequest';
import ProtectedRoute from '../../../app/routes/ProtectedRoute';

const rentalsRoutes = [
  {
    path: '/properties/:propertyId/rental-requests',
    element: <ProcessRentalRequests />,
  },
  {
    path: '/rooms/:roomId/rental-request',
    element: <ProtectedRoute roles={['tenant']}><SubmitRentalRequest /></ProtectedRoute>,
  },
];

export default rentalsRoutes;
