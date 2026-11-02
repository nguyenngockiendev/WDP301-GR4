import React from 'react';
import Auth from '../pages/Auth';

const authRoutes = [
  { path: '/login', element: <Auth /> },
  { path: '/register', element: <Auth register /> },
];

export default authRoutes;
