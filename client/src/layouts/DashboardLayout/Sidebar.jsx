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
    </aside>
  );
}
