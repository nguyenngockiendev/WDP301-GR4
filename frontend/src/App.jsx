import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Records from './pages/Records';
import { ManagementList, ManagementForm, ManagementDetail } from './pages/Management';
import { BuildingsList, BuildingForm, BuildingDetail } from './pages/Buildings';
function Protected({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return (
      <div role="alert" className="alert alert-danger">
        You do not have access to this page.
      </div>
    );
  return <Outlet />;
}
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Auth />} />
        <Route path="register" element={<Auth register />} />
        <Route element={<Protected />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="workspace/:module" element={<Records />} />
          <Route element={<Protected roles={['ADMIN']} />}>
            <Route path="users" element={<ManagementList kind="users" />} />
            <Route path="users/new" element={<ManagementForm kind="users" />} />
            <Route path="users/:id" element={<ManagementDetail kind="users" />} />
            <Route path="buildings" element={<BuildingsList />} />
            <Route path="buildings/new" element={<BuildingForm />} />
            <Route path="buildings/:id" element={<BuildingDetail />} />
            <Route path="buildings/:id/edit" element={<BuildingForm />} />
            <Route path="rooms/new" element={<ManagementForm kind="rooms" />} />
          </Route>
          <Route element={<Protected roles={['ADMIN', 'MANAGER']} />}>
            <Route path="rooms" element={<ManagementList kind="rooms" />} />
            <Route path="rooms/:id" element={<ManagementDetail kind="rooms" />} />
          </Route>
        </Route>
        <Route path="*" element={<h1>Page not found</h1>} />
      </Route>
    </Routes>
  );
}
