import React, { useState } from 'react';

export default function RevenueChart() {
  // Chế độ so sánh: 'target' (Mục tiêu - Cam hổ phách) hoặc 'previous' (Cùng kỳ - Tím Indigo)
  const [accentColorMode, setAccentColorMode] = useState('amber'); // 'amber' | 'indigo' | 'cyan'

  const colorPalettes = {
    amber: {
      name: 'Cam Hổ Phách (Ấm áp, tương phản cao)',
      label2: 'Mục tiêu tháng',
      stroke: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.12)',
      bgPill: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    indigo: {
      name: 'Tím Indigo (Sang trọng phong cách Stripe)',
      label2: 'Cùng kỳ năm ngoái',
      stroke: '#6366f1',
      fill: 'rgba(99, 102, 241, 0.12)',
      bgPill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    cyan: {
      name: 'Xanh Lam Cyan (Công nghệ, mát mẻ)',
      label2: 'Tiền dịch vụ (Điện/Nước)',
      stroke: '#06b6d4',
      fill: 'rgba(6, 182, 212, 0.12)',
      bgPill: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      dot: 'bg-cyan-500',
    },
  };

  const currentTheme = colorPalettes[accentColorMode];

  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between h-full">
      {/* Tiêu đề & Chú thích Màu (Legend) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
            Biểu Đồ Tăng Trưởng Doanh Thu
          </h3>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">
            Dữ liệu so sánh 6 tháng gần nhất
          </p>
        </div>

        {/* Chú thích 2 đường màu */}
        <div className="flex items-center gap-3">
          {/* Đường 1: Xanh ngọc */}
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-emerald-50/80 px-2.5 py-1 rounded-xl border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-xs" />
            <span>Thực thu (54.5 tr)</span>
          </div>

          {/* Đường 2: Màu phụ (Bấm vào để đổi bảng màu xem thử) */}
          <button
            onClick={() => {
              const modes = ['amber', 'indigo', 'cyan'];
              const next = modes[(modes.indexOf(accentColorMode) + 1) % modes.length];
              setAccentColorMode(next);
            }}
            title="Nhấp để đổi thử màu phụ (Cam / Tím / Lam)"
            className={`flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-xl border transition cursor-pointer hover:scale-105 active:scale-95 ${currentTheme.bgPill}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentTheme.dot}`} />
            <span>{currentTheme.label2}</span>
            <span className="text-[9px] opacity-60 ml-0.5">⇄</span>
          </button>
        </div>
      </div>

      {/* Vùng đồ thị SVG chuẩn xác (Fix triệt để lỗi đường cong uốn vọt ra ngoài) */}
      <div className="relative h-48 w-full flex items-end">
        <svg
          viewBox="0 0 540 160"
          className="w-full h-full overflow-hidden"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient Xanh Ngọc (Đường chính) */}
            <linearGradient id="emeraldSmoothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Gradient Màu Phụ (Đường so sánh) */}
            <linearGradient id="accentSmoothGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.stroke} stopOpacity="0.25" />
              <stop offset="70%" stopColor={currentTheme.stroke} stopOpacity="0.04" />
              <stop offset="100%" stopColor={currentTheme.stroke} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Đường lưới tọa độ nằm ngang (Grid lines mờ tinh tế) */}
          <line x1="20" y1="35" x2="520" y2="35" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
          <line x1="20" y1="75" x2="520" y2="75" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />
          <line x1="20" y1="115" x2="520" y2="115" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" opacity="0.6" />

          {/* ================= ĐƯỜNG 2: MÀU PHỤ (ĐƯỜNG SO SÁNH / MỤC TIÊU) ================= */}
          {/* Vùng đổ bóng màu phụ */}
          <path
            d="M 20 120 C 70 120, 90 100, 120 100 C 150 100, 180 110, 220 105 C 260 100, 290 85, 330 80 C 370 75, 400 85, 440 70 C 470 60, 490 65, 520 60 L 520 155 L 20 155 Z"
            fill="url(#accentSmoothGrad)"
          />
          {/* Nét vẽ đường 2 (nét đứt thanh lịch) */}
          <path
            d="M 20 120 C 70 120, 90 100, 120 100 C 150 100, 180 110, 220 105 C 260 100, 290 85, 330 80 C 370 75, 400 85, 440 70 C 470 60, 490 65, 520 60"
            fill="none"
            stroke={currentTheme.stroke}
            strokeWidth="2.5"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />

          {/* ================= ĐƯỜNG 1: XANH NGỌC (DOANH THU THỰC TẾ) ================= */}
          {/* Vùng đổ gradient xanh ngọc (tuyệt đối không bị vọt ra ngoài x-axis) */}
          <path
            d="M 20 130 C 70 130, 85 105, 120 105 C 155 105, 185 110, 220 110 C 265 110, 290 75, 330 75 C 370 75, 400 70, 440 70 C 475 70, 495 35, 520 35 L 520 155 L 20 155 Z"
            fill="url(#emeraldSmoothGrad)"
          />
          {/* Nét vẽ đường xanh ngọc dày dặn, mượt mà chuẩn Bézier */}
          <path
            d="M 20 130 C 70 130, 85 105, 120 105 C 155 105, 185 110, 220 110 C 265 110, 290 75, 330 75 C 370 75, 400 70, 440 70 C 475 70, 495 35, 520 35"
            fill="none"
            stroke="#059669"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Điểm nhấn nổi bật ở Tháng 8 (330, 75) */}
          <circle cx="330" cy="75" r="4" fill="#059669" />
          <circle cx="330" cy="75" r="8" fill="#059669" fillOpacity="0.2" />

          {/* Điểm nhấn đỉnh cao nhất Tháng 10 (520, 35) */}
          <circle cx="520" cy="35" r="5" fill="#059669" />
          <circle cx="520" cy="35" r="11" fill="#059669" fillOpacity="0.25" />

          {/* Điểm mốc của đường phụ ở Tháng 10 (520, 60) */}
          <circle cx="520" cy="60" r="4" fill={currentTheme.stroke} />
        </svg>
      </div>

      {/* Trục hoành các tháng (Căn chỉnh cân xứng hoàn hảo với các điểm tọa độ) */}
      <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2 px-3 border-t border-slate-100/80 pt-2">
        <span>Tháng 5</span>
        <span>Tháng 6</span>
        <span>Tháng 7</span>
        <span>Tháng 8</span>
        <span>Tháng 9</span>
        <span className="text-emerald-700 font-extrabold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
          Tháng 10 (Hiện tại)
        </span>
      </div>
    </div>
  );
}