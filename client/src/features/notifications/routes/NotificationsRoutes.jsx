import { Navigate } from 'react-router-dom';

export default [
  { path: '/notifications', element: <Navigate to="/dashboard?notifications=open" replace /> },
  {
    path: '/notifications/manage',
    element: <Navigate to="/dashboard?notifications=open" replace />,
  },
];
