import React from 'react';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyOtp from '../pages/VerifyOtp';

const authRoutes = [
  {
    path: '/login',
    element: <Login />,
  },
  { path: '/register', element: <Register /> },
  { path: '/verify-otp', element: <VerifyOtp /> },
];

export default authRoutes;
