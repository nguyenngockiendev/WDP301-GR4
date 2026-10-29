import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { NotificationsProvider } from '../../features/notifications/hooks/useNotifications';

export default function DashboardLayout() {
  return (
    <NotificationsProvider><div className="dashboard-shell">
      <Header />
      <div className="dashboard-body">
        <Sidebar />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div></NotificationsProvider>
  );
}
