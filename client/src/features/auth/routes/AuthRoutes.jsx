import React from 'react';
import Auth from '../pages/Auth';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';

const authRoutes = [
  { path: '/login', element: <Auth /> },
  { path: '/register', element: <Auth register /> },
  { path: '/verify-email', element: <VerifyEmail /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
];

export default authRoutes;
