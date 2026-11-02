import React from 'react';
import { LogOut, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';

export default function Header() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-end gap-3 border-b border-emerald-100 bg-white/90 px-6 backdrop-blur">
      <button
        onClick={() => navigate('/contracts/new')}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <Plus size={16} />
        Tạo hợp đồng
      </button>
      <button
        onClick={handleLogout}
        title="Đăng xuất"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
      >
        <LogOut size={16} />
      </button>
    </header>
  );
}
