import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Header() {
  const { user, logout } = useAuth();
  const [error, setError] = React.useState('');
  return (
    <header className="topbar">
      <div className="breadcrumb-label">Smart Rental Management System / Workspace</div>
      <div className="topbar-account">
        {user ? (
          <>
            <Link to="/workspace/notifications">Notifications</Link>
            <span className="avatar">{user.name[0]}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{user.roleLabel}</small>
            </div>
            <button
              className="btn btn-light"
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
