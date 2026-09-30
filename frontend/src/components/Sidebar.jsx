import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const routeIcons = {
  '/dashboard': '◫',
  '/profile': '◉',
  '/login': '↪',
  '/register': '+',
  '/buildings': '⌂',
  '/users': '♙',
  '/reports': '▥',
  '/rooms': '▦',
};

const groupIcons = {
  PROPERTY: '⌂',
  OPERATIONS: '▦',
  FINANCE: '＄',
  SETTINGS: '⚙',
  ACCOUNT: '◉',
};

export default function Sidebar() {
  const { user, modules } = useAuth();
  const links = user
    ? [
        ['/dashboard', 'Overview', routeIcons['/dashboard']],
        ['/profile', 'My profile', routeIcons['/profile']],
      ]
    : [
        ['/login', 'Sign in', routeIcons['/login']],
        ['/register', 'Create account', routeIcons['/register']],
      ];
  if (user?.role === 'LANDLORD')
    links.push(
      ['/buildings', 'Rental houses', routeIcons['/buildings']],
      ['/users', 'Accounts', routeIcons['/users']],
      ['/reports', 'Business reports', routeIcons['/reports']],
    );
  if (['LANDLORD', 'MANAGER'].includes(user?.role))
    links.push(['/rooms', 'Rooms', routeIcons['/rooms']]);
  return (
    <aside className="sidebar">
      <Link className="brand" to="/">
        <span className="brand-icon">SR</span>
        <span>
          Smart Rental<span className="brand-sub">MANAGEMENT SYSTEM</span>
        </span>
      </Link>
      <nav aria-label="Main navigation">
        <div className="nav-group">WORKSPACE</div>
        {links.map(([to, label, icon]) => (
          <NavLink
            end={to === '/'}
            key={to}
            to={to}
            className={({ isActive }) => 'nav-link ' + (isActive ? 'active' : '')}
          >
            <span className="nav-icon" aria-hidden="true">
              {icon}
            </span>
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
                    <span className="nav-icon" aria-hidden="true">
                      {groupIcons[group] || '◦'}
                    </span>
                    {m.title}
                  </NavLink>
                ))}
              </React.Fragment>
            )
          );
        })}
      </nav>
      <div className="sidebar-note">Smart operations for every rental home</div>
    </aside>
  );
}
