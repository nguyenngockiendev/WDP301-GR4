import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Header() {
  const { user, logout } = useAuth();
  const [error, setError] = React.useState('');
  return (
    <header className="topbar">
      <div className="breadcrumb-label">
        {user ? (
          <>
            Workspace <span aria-hidden="true">/</span> {user.roleLabel}
          </>
        ) : (
          'Smart Rental Management System'
        )}
      </div>
      <div className="topbar-account" aria-label="User account">
        {user ? (
          <>
            <Link to="/workspace/notifications">Notifications</Link>
            <span className="avatar" aria-hidden="true">
              {user.name?.trim().charAt(0) || 'U'}
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.roleLabel}</small>
            </div>
            <button
              className="btn btn-light"
              type="button"
              onClick={() => logout().catch(e => setError(e.message))}
            >
              Sign out
            </button>
            {error && <span role="alert">{error}</span>}
          </>
        ) : (
          <span>Manage every rental operation in one place.</span>
        )}
      </div>
    </header>
  );
}
