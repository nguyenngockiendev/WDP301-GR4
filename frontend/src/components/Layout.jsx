import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
export default function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-shell">
        <Header />
        <main className="page-content">
          <Outlet />
          <Footer />
        </main>
      </div>
    </div>
  );
}
