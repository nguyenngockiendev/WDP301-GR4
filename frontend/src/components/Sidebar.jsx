import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export default function Sidebar() {
  const { user, modules } = useAuth();
  const links = user
    ? [
        ['/', 'Overview'],
        ['/profile', 'My profile'],
      ]
    : [
        ['/login', 'Sign in'],
        ['/register', 'Create account'],
      ];
  if (user?.role === 'ADMIN') links.push(['/users', 'People']);
  if (['ADMIN', 'MANAGER'].includes(user?.role)) links.push(['/rooms', 'Rooms']);
  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-icon">h.</span>
        <span>
          haven<span className="brand-sub">PROPERTY WORKSPACE</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <div className="nav-group">WORKSPACE</div>
        {links.map(([to, label]) => (
          <NavLink
            end={to === '/'}
            key={to}
            to={to}
            className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
          >
            <span className="nav-icon">·</span>
            {label}
          </NavLink>
        ))}
        {['PROPERTY', 'OPERATIONS', 'FINANCE', 'SETTINGS', 'ACCOUNT'].map(group => {
          const entries = Object.entries(modules).filter(([, m]) => m.group === group);
          return (
            entries.length > 0 && (
              <React.Fragment key={group}>
                <div className="nav-group">{group}</div>
                {entries.map(([key, m]) => (
                  <NavLink
                    className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
                    key={key}
                    to={'/workspace/' + key}
                  >
                    <span className="nav-icon">·</span>
                    {m.title}
                  </NavLink>
                ))}
              </React.Fragment>
            )
          );
        })}
      </nav>
      <div className="sidebar-note">Your everyday property workspace</div>
    </aside>
  );
}
