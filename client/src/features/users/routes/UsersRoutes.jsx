import React from 'react';
import {
  ManagementDetail,
  ManagementForm,
  ManagementList,
} from '../../rooms/pages/Management';

const usersRoutes = [
  { path: '/users', element: <ManagementList kind="users" />, roles: ['LANDLORD'] },
  { path: '/users/new', element: <ManagementForm kind="users" />, roles: ['LANDLORD'] },
  { path: '/users/:id', element: <ManagementDetail kind="users" />, roles: ['LANDLORD'] },
];

export default usersRoutes;
