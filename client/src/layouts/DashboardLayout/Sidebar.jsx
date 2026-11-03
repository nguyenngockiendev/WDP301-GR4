import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  DoorOpen,
  FileSignature,
  CalendarClock,
  Users,
  Zap,
  ReceiptText,
  ChevronLeft,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function Sidebar({ isCollapsed, setIsCollapsed }) {
  const menuSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      ],
    },
    {
      title: 'QUẢN LÝ CHO THUÊ',
      items: [
        { to: '/', label: 'Danh sách phòng', icon: DoorOpen },
        { to: '/', label: 'Hợp đồng thuê', icon: FileSignature },
        {
          to: '/',
          label: 'Yêu cầu đặt phòng',
          icon: CalendarClock,
          badge: '2',
        },
        { to: '/', label: 'Khách thuê', icon: Users },
      ],
    },
    {
      title: 'DỊCH VỤ & TÀI CHÍNH',
      items: [
        { to: '/', label: 'Số điện & nước', icon: Zap },
        { to: '/', label: 'Hóa đơn tiền phòng', icon: ReceiptText },
      ],
    },
  ];

  return (
    <aside
      className={`my-3 ml-3 h-[calc(100vh-1.5rem)] rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/90 flex flex-col justify-between shrink-0 p-3 select-none shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out relative z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* NÚT TOGGLE THU GỌN / MỞ RỘNG (GẮN NGAY MÉP BORDER - SIÊU HIỆN ĐẠI & KHÔNG BỊ LỆCH) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-7 w-7 h-7 rounded-full bg-white border border-emerald-100 shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-50 group"
        title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
      >
        <ChevronLeft
          size={14}
          className={`stroke-[2.5] transition-transform duration-300 text-slate-500 group-hover:text-emerald-600 ${
            isCollapsed ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* PHẦN TRÊN: LOGO & MENU ITEMS */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div
          className={`flex items-center gap-3 pt-2 pb-4 mb-2 border-b border-emerald-50/80 ${
            isCollapsed ? 'justify-center px-0' : 'px-2'
          }`}
        >
          {/* Logo Icon cách điệu Gradient */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0 relative overflow-hidden group">
            <Building2 size={20} className="stroke-[2.2] relative z-10 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Brand Name & Tag khi mở rộng */}
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base text-slate-800 tracking-tight whitespace-nowrap">
                  Haven<span className="text-emerald-600">Stay</span>
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200/50">
                  PRO
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400 truncate">
                Quản lý căn hộ & trọ
              </span>
            </div>
          )}
        </div>

        {/* Danh sách Menu Items phân nhóm khoa học */}
        <nav className="space-y-4 flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Phân cách / Tiêu đề nhóm */}
              {isCollapsed ? (
                sIdx > 0 && <div className="w-8 h-px bg-slate-100 mx-auto my-2" />
              ) : (
                <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400/80">
                  {section.title}
                </div>
              )}

              {/* Các liên kết trong nhóm */}
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                        isCollapsed
                          ? 'w-11 h-11 justify-center mx-auto'
                          : 'gap-3 px-3.5 py-2.5'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-600/25 font-extrabold'
                          : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          className={`shrink-0 transition-transform duration-200 ${
                            isActive
                              ? 'text-white scale-105'
                              : 'text-slate-400 group-hover:text-emerald-600 group-hover:scale-110'
                          }`}
                        />

                        {!isCollapsed && (
                          <span className="whitespace-nowrap overflow-hidden text-ellipsis font-bold flex-1">
                            {item.label}
                          </span>
                        )}

                        {/* Badge thông báo nếu có */}
                        {item.badge && (
                          <span
                            className={`shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded-full transition ${
                              isActive
                                ? 'bg-white text-emerald-700 shadow-xs'
                                : 'bg-emerald-100 text-emerald-800'
                            } ${isCollapsed ? 'absolute -top-1 -right-1 ring-2 ring-white text-[9px] w-4 h-4 flex items-center justify-center p-0' : ''}`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Tooltip hiển thị khi thu gọn */}
                        {isCollapsed && (
                          <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 shadow-xl border border-slate-700/50 flex items-center gap-1.5">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[9px]">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* PHẦN DƯỚI: WIDGET TỶ LỆ LẤP ĐẦY & PROFILE QUẢN LÝ */}
      <div className="pt-2 border-t border-emerald-50/80 space-y-2 shrink-0">
        {/* Widget Lấp đầy phòng (Chỉ hiển thị khi mở rộng) */}
        {!isCollapsed && (
          <div className="p-2.5 rounded-2xl bg-gradient-to-b from-white/90 to-emerald-50/50 border border-emerald-100/70 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Lấp đầy phòng
              </span>
              <span className="text-emerald-700 font-black">75%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-3/4" />
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-semibold">
              <span>18 đã thuê</span>
              <span>24 tổng phòng</span>
            </div>
          </div>
        )}

        {/* Thông tin Quản lý */}
        <div
          className={`flex items-center gap-2.5 p-1.5 rounded-2xl hover:bg-slate-50/80 transition cursor-pointer group ${
            isCollapsed ? 'justify-center' : 'px-2'
          }`}
          title="Tài khoản Quản lý Tòa nhà"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-xs">
              QL
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-extrabold text-slate-800 truncate">
                Ban Quản Lý
              </span>
              <span className="text-[10px] font-medium text-slate-400 truncate">
                admin@havenstay.vn
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}