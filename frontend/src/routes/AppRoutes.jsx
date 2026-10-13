import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Auth from '../modules/auth/Auth';
import Dashboard from '../modules/dashboard/Dashboard';
import Home from '../modules/home/Home';
import Profile from '../modules/profile/Profile';
import Records from '../modules/workspace/Records';
import { ManagementList, ManagementForm, ManagementDetail } from '../modules/rooms/Management';
import { BuildingsList, BuildingForm, BuildingDetail } from '../modules/buildings/Buildings';
import Reports from '../modules/reports/Reports';
import RentalSettings from '../modules/rental-settings/RentalSettings';
import NewContract from '../modules/contracts/NewContract';
import Billing from '../modules/billing/Billing';
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
          <Route element={<Protected roles={['LANDLORD', 'MANAGER']} />}>
            <Route path="billing" element={<Billing />} />
          </Route>
          <Route element={<Protected roles={['LANDLORD']} />}>
            <Route path="users" element={<ManagementList kind="users" />} />
            <Route path="users/new" element={<ManagementForm kind="users" />} />
            <Route path="users/:id" element={<ManagementDetail kind="users" />} />
            <Route path="buildings" element={<BuildingsList />} />
            <Route path="buildings/new" element={<BuildingForm />} />
            <Route path="buildings/:id" element={<BuildingDetail />} />
            <Route path="buildings/:id/edit" element={<BuildingForm />} />
            <Route path="reports" element={<Reports type="revenue" />} />
            <Route path="settings" element={<RentalSettings />} />
            <Route path="reports/revenue" element={<Reports type="revenue" />} />
            <Route path="reports/outstanding" element={<Reports type="outstanding" />} />
            <Route path="reports/occupancy" element={<Reports type="occupancy" />} />
            <Route path="contracts/new" element={<NewContract />} />
            <Route path="rooms/new" element={<ManagementForm kind="rooms" />} />
          </Route>
          <Route element={<Protected roles={['LANDLORD', 'MANAGER']} />}>
            <Route path="rooms" element={<ManagementList kind="rooms" />} />
            <Route path="rooms/:id" element={<ManagementDetail kind="rooms" />} />
          </Route>
        </Route>
        <Route path="*" element={<h1>Page not found</h1>} />
      </Route>
    </Routes>
  );
}
