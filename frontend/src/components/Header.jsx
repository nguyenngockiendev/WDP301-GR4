import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  IconMenu,
  IconBell,
  IconSearch,
  IconChevronRight,
  IconHome,
  IconLogout,
  IconSun,
  IconMoon,
} from './Icons';

export default function Header({ onToggleMobileMenu }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = React.useState('');
  const location = useLocation();

  // Generate breadcrumb text from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const currentTitle =
    pathSegments.length > 0 ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ') : 'Home';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-menu-btn d-md-none"
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <IconMenu size={20} />
        </button>

        <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-item breadcrumb-home" title="Go to home">
            <IconHome size={15} />
          </Link>
          {user && (
            <>
              <IconChevronRight size={13} className="breadcrumb-separator" />
              <span className="breadcrumb-item">Workspace</span>
              <IconChevronRight size={13} className="breadcrumb-separator" />
              <span className="breadcrumb-item breadcrumb-current text-capitalize">
                {currentTitle}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="topbar-center d-none d-lg-flex">
        <div className="topbar-search">
          <IconSearch size={15} className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search rooms, tenants, contracts... (Press / to search)"
            readOnly
            onClick={() => {}}
          />
          <kbd className="topbar-search-kbd">⌘K</kbd>
        </div>
      </div>

      <div className="topbar-right">
        {/* Theme Toggle Button */}
        <button
          className="topbar-action-btn theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        {user ? (
          <>
            <Link to="/workspace/notifications" className="topbar-action-btn" title="Notifications">
              <IconBell size={18} />
              <span className="notification-indicator" />
            </Link>

            <div className="topbar-divider" />

            <div className="topbar-user">
              <span className="avatar" aria-hidden="true">
                {user.name?.trim().charAt(0).toUpperCase() || 'U'}
              </span>
              <div className="topbar-user-details d-none d-sm-block">
                <span className="topbar-user-name">{user.name}</span>
                <span className="topbar-user-role">{user.roleLabel || user.role}</span>
              </div>
              <button
                className="topbar-logout-btn"
                type="button"
                title="Sign out"
                onClick={() => logout().catch(e => setError(e.message))}
              >
                <IconLogout size={16} />
              </button>
            </div>
            {error && (
              <span className="topbar-error" role="alert">
                {error}
              </span>
            )}
          </>
        ) : (
          <div className="topbar-public-actions">
            <Link to="/login" className="btn btn-outline-primary btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
