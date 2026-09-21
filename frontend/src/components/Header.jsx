import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Header() {
  const { user, logout } = useAuth();
  const [error, setError] = React.useState('');
  return (
    <header className="topbar">
      <div className="breadcrumb-label">Haven / Property workspace</div>
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
          <span>A better place to manage home.</span>
        )}
      </div>
    </header>
  );
}
