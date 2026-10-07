import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconDashboard,
  IconUser,
  IconBuilding,
  IconUsers,
  IconReports,
  IconRoom,
  IconContract,
  IconRequest,
  IconUtility,
  IconInvoice,
  IconPayment,
  IconDeposit,
  IconCheckout,
  IconBell,
  IconSettings,
  IconLogin,
  IconRegister,
  IconLogout,
  IconClose,
  IconSparkles,
} from './Icons';

const moduleIcons = {
  buildings: IconBuilding,
  contracts: IconContract,
  requests: IconRequest,
  readings: IconUtility,
  invoices: IconInvoice,
  payments: IconPayment,
  deposits: IconDeposit,
  checkouts: IconCheckout,
  notifications: IconBell,
  rates: IconSettings,
  fees: IconSettings,
  policies: IconSettings,
};

const groupIcons = {
  PROPERTY: IconBuilding,
  OPERATIONS: IconRoom,
  FINANCE: IconInvoice,
  SETTINGS: IconSettings,
  ACCOUNT: IconUser,
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, modules, logout } = useAuth();

  const links = user
    ? [
        { to: '/dashboard', label: 'Overview', icon: IconDashboard },
        { to: '/profile', label: 'My profile', icon: IconUser },
      ]
    : [
        { to: '/login', label: 'Sign in', icon: IconLogin },
        { to: '/register', label: 'Create account', icon: IconRegister },
      ];

  if (user?.role === 'LANDLORD') {
    links.push(
      { to: '/buildings', label: 'Buildings', icon: IconBuilding },
      { to: '/users', label: 'Accounts', icon: IconUsers },
      { to: '/reports/revenue', label: 'Revenue report', icon: IconReports },
      { to: '/reports/outstanding', label: 'Outstanding balance', icon: IconInvoice },
      { to: '/reports/occupancy', label: 'Occupancy report', icon: IconRoom },
    );
  }

  if (['LANDLORD', 'MANAGER'].includes(user?.role)) {
    links.push({ to: '/rooms', label: 'Rooms', icon: IconRoom });
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-wrapper">
          <Link className="brand" to="/" onClick={onClose}>
            <div className="brand-icon">
              <span className="brand-glyph">SR</span>
            </div>
            <div className="brand-text">
              <span className="brand-title">Smart Rental</span>
              <span className="brand-sub">MANAGEMENT SUITE</span>
            </div>
          </Link>
          <button
            className="sidebar-close-btn d-md-none"
            type="button"
            onClick={onClose}
            aria-label="Close menu"
          >
            <IconClose size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="nav-group">WORKSPACE</div>
          {links.map(({ to, label, icon: IconComponent }) => (
            <NavLink
              end={to === '/' || to === '/dashboard'}
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
            >
              <span className="nav-icon" aria-hidden="true">
                <IconComponent size={18} />
              </span>
              <span className="nav-text">{label}</span>
            </NavLink>
          ))}

          {['PROPERTY', 'OPERATIONS', 'FINANCE', 'SETTINGS', 'ACCOUNT'].map(group => {
            const entries = Object.entries(modules || {}).filter(([, m]) => m.group === group);
            if (!entries.length) return null;

            return (
              <React.Fragment key={group}>
                <div className="nav-group">{group}</div>
                {entries.map(([key, m]) => {
                  const SpecificIcon = moduleIcons[key] || groupIcons[group] || IconSparkles;
                  return (
                    <NavLink
                      className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
                      key={key}
                      to={'/workspace/' + key}
                      onClick={onClose}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        <SpecificIcon size={18} />
                      </span>
                      <span className="nav-text">{m.title}</span>
                    </NavLink>
                  );
                })}
              </React.Fragment>
            );
          })}
        </nav>

        {user ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {user.name?.trim().charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name" title={user.name}>
                {user.name}
              </span>
              <span className="sidebar-user-role">{user.roleLabel || user.role}</span>
            </div>
            <button
              className="sidebar-logout-btn"
              type="button"
              title="Sign out"
              onClick={() => logout().catch(console.error)}
            >
              <IconLogout size={16} />
            </button>
          </div>
        ) : (
          <div className="sidebar-note">
            <div className="sidebar-note-tag">
              <IconSparkles size={13} className="text-emerald" /> PRO PLATFORM
            </div>
            <span>Intelligent operations for modern property management.</span>
          </div>
        )}
      </aside>
    </>
  );
}
