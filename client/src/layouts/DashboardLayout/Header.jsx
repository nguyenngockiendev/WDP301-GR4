import React from 'react';
import { Search, Plus, ChevronDown, Bell, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <header className="h-20 bg-white/40 backdrop-blur-md px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 border-b border-emerald-100/40">
      {/* Khối chọn tòa nhà */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 backdrop-blur-md border border-emerald-100/80 shadow-xs cursor-pointer hover:border-emerald-300 transition">
        <span className="text-xs font-bold text-slate-800">
          Tòa Nhà Bình An — 123 Nguyễn Trãi
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </div>

      {/* Khối bên phải: Tìm kiếm, Thông báo, Nút tạo HĐ, Đăng xuất */}
      <div className="flex items-center gap-3.5">
        {/* Thanh tìm kiếm */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm phòng, khách thuê..."
            className="w-64 pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white/80 backdrop-blur-md border border-emerald-100/80 outline-none text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition shadow-xs"
          />
        </div>

        {/* Nút Chuông */}
        <button className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md border border-emerald-100/80 text-slate-600 hover:text-emerald-600 flex items-center justify-center transition shadow-xs cursor-pointer">
          <Bell size={16} />
        </button>

        {/* Nút Tạo Hợp Đồng Mới (Xanh Emerald Gradient) */}
        <button
          onClick={() => navigate('/contracts')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus size={16} className="stroke-[3]" />
          <span>Tạo Hợp Đồng Mới</span>
        </button>

        {/* Nút Đăng xuất */}
        <button
          onClick={handleLogout}
          title="Đăng xuất"
          className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur-md border border-emerald-100/80 text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition shadow-xs cursor-pointer ml-1"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
