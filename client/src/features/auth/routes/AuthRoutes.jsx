import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import { Navigate } from "react-router-dom";
import HomePage from '../../home/HomePage';

export const authRoutes = [
  {
    path: "/home",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/register",
    element: <Navigate to="/login" replace />,
  },
];
