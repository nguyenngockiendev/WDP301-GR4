import React from 'react';
import RentalSettings from '../pages/RentalSettings';

const rentalSettingsRoutes = [
  { path: '/settings', element: <RentalSettings />, roles: ['LANDLORD'] },
];

export default rentalSettingsRoutes;
