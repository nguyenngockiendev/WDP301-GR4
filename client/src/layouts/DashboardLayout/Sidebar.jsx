import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="dashboard-sidebar">
      <div className="text-uppercase small fw-semibold text-muted mb-3">Menu chính</div>
      <nav className="nav flex-column gap-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `nav-link rounded px-3 py-2 ${isActive ? 'bg-primary text-white' : 'text-dark'}`
          }
        >
          Dashboard
        </NavLink>
      </nav>
      <NavLink to="/notifications" className={({ isActive }) => `mt-2 block rounded-xl px-4 py-2 text-sm font-semibold ${isActive ? 'bg-primary text-white' : 'text-content-sub hover:bg-primary-50'}`}>Thông báo</NavLink>
    </aside>
  );
}
