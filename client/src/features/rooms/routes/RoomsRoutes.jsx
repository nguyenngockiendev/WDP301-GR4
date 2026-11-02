import React from 'react';
import {
  ManagementDetail,
  ManagementForm,
  ManagementList,
} from '../pages/Management';

const roomsRoutes = [
  { path: '/rooms', element: <ManagementList kind="rooms" />, roles: ['LANDLORD', 'MANAGER'] },
  { path: '/rooms/new', element: <ManagementForm kind="rooms" />, roles: ['LANDLORD'] },
  { path: '/rooms/:id', element: <ManagementDetail kind="rooms" />, roles: ['LANDLORD', 'MANAGER'] },
];

export default roomsRoutes;
