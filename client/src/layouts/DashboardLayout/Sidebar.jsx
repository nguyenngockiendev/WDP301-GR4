import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import {
  IconBuilding,
  IconContract,
  IconDashboard,
  IconInvoice,
  IconReports,
  IconRoom,
  IconSettings,
  IconUser,
  IconUsers,
} from '../../shared/components/Icons';

const baseLinks = [
  { to: '/dashboard', label: 'Tổng quan', icon: IconDashboard },
  { to: '/profile', label: 'Tài khoản', icon: IconUser },
];

export default function Sidebar({ isCollapsed }) {
  const { user } = useAuth();
  const links = [...baseLinks];

  if (user?.role === 'LANDLORD') {
    links.push(
      { to: '/buildings', label: 'Dãy trọ', icon: IconBuilding },
      { to: '/users', label: 'Người dùng', icon: IconUsers },
      { to: '/settings', label: 'Cài đặt giá', icon: IconSettings },
      { to: '/reports/revenue', label: 'Báo cáo', icon: IconReports },
      { to: '/contracts/new', label: 'Tạo hợp đồng', icon: IconContract },
    );
  }

  if (['LANDLORD', 'MANAGER'].includes(user?.role)) {
    links.push(
      { to: '/rooms', label: 'Phòng trọ', icon: IconRoom },
      { to: '/billing', label: 'Hóa đơn', icon: IconInvoice },
    );
  }

  return (
    <aside className="h-screen w-64 shrink-0 border-r border-emerald-100 bg-white/90 px-4 py-5">
      <div className="mb-8 px-3">
        <div className="text-lg font-bold text-emerald-800">Smart Rental</div>
        {!isCollapsed && <div className="text-xs text-slate-500">Quản lý nhà trọ</div>}
      </div>

      <nav className="space-y-1" aria-label="Điều hướng chính">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? 'bg-emerald-50 font-semibold text-emerald-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={18} />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!isCollapsed && user && (
        <div className="absolute bottom-5 left-4 right-4 border-t border-slate-100 pt-4">
          <div className="truncate text-sm font-semibold text-slate-800">{user.name}</div>
          <div className="text-xs text-slate-500">{user.roleLabel || user.role}</div>
        </div>
      )}
    </aside>
  );
}
