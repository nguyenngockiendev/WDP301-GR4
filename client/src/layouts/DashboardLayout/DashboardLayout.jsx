import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-800 relative select-none">
      {/* NỀN MESH GRAPHIC XANH NGỌC (MINT & EMERALD AMBIENT) */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#f8fafc]">
        {/* Vệt ánh sáng xanh ngọc bích phía trên trái */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-emerald-200/40 filter blur-[120px]" />
        
        {/* Vệt ánh sáng xanh bạc hà trung tâm */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-teal-100/50 filter blur-[140px]" />
        
        {/* Vệt ánh sáng ngọc bích phía dưới phải */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/60 filter blur-[120px]" />
      </div>

      {/* Sidebar bên trái có nút thu gọn */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Khung nội dung chính bên phải */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-8 pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
