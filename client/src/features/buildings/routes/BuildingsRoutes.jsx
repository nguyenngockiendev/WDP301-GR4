import React from 'react';
import {
  BuildingDetail,
  BuildingForm,
  BuildingsList,
} from '../pages/Buildings';

const buildingsRoutes = [
  { path: '/buildings', element: <BuildingsList />, roles: ['LANDLORD'] },
  { path: '/buildings/new', element: <BuildingForm />, roles: ['LANDLORD'] },
  { path: '/buildings/:id', element: <BuildingDetail />, roles: ['LANDLORD'] },
  { path: '/buildings/:id/edit', element: <BuildingForm />, roles: ['LANDLORD'] },
];

export default buildingsRoutes;
