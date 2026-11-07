import React from 'react';
import AppRoutes from './app/routes/AppRoutes';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function App() {
  return (
    <>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        {' '}
        <AppRoutes />
      </GoogleOAuthProvider>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
