import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from '../../features/notifications/components/NotificationBell';

export default function Header() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="navbar navbar-light bg-white border-bottom px-4 py-2 d-flex justify-content-between">
      <Link to="/dashboard" className="navbar-brand fw-bold text-primary mb-0">
        WDP301 App
      </Link>
      <div className="d-flex align-items-center gap-3">
        {token && <NotificationBell />}
        {token ? (
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
            Đăng xuất
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            Đăng nhập
          </Link>
        )}
      </div>
    </header>
  );
}
