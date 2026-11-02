import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import Layout from '../../shared/components/Layout';
import Auth from '../../features/auth/pages/Auth';
import Dashboard from '../../features/dashboard/pages/Dashboard';
import Home from '../../features/home/pages/Home';
import Profile from '../../features/profile/pages/Profile';
import Records from '../../features/workspace/pages/Records';
import {
  ManagementList,
  ManagementForm,
  ManagementDetail,
} from '../../features/rooms/pages/Management';
import {
  BuildingsList,
  BuildingForm,
  BuildingDetail,
} from '../../features/buildings/pages/Buildings';
import Reports from '../../features/reports/pages/Reports';
import RentalSettings from '../../features/rental-settings/pages/RentalSettings';
import NewContract from '../../features/contracts/pages/NewContract';
import Billing from '../../features/billing/pages/Billing';

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

export default function AppRoutes() {
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
