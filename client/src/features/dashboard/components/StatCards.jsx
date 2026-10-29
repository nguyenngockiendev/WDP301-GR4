import React from 'react';

export default function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Thẻ 1: Doanh Thu */}
      <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md transition flex flex-col justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Doanh Thu Tháng 10
        </span>
        <div className="my-3">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            54.500.000 <span className="text-base font-bold text-slate-800">đ</span>
          </h3>
        </div>
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100/70 text-emerald-800 border border-emerald-200/60">
            +14% so với tháng trước
          </span>
        </div>
      </div>

      {/* Thẻ 2: Tỷ Lệ Lấp Đầy (Có hình phòng 3D) */}
      <div className="p-6 rounded-3xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200/50 shadow-[0_8px_30px_rgb(5,150,105,0.04)] hover:shadow-md transition flex items-center justify-between relative overflow-hidden">
        <div className="flex flex-col justify-between h-full z-10">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Tỷ Lệ Lấp Đầy
          </span>
          <div className="my-2">
            <h3 className="text-3xl font-black text-emerald-950 tracking-tight">
              75%
            </h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-800">
            18/24 phòng đang thuê
          </span>
        </div>

        {/* Khối Isometric Room minh họa */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-1 shadow-md shadow-emerald-600/25 flex items-center justify-center text-white shrink-0">
          <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center">
            <svg
              className="w-8 h-8 fill-white/90 mb-1"
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-100">
              Phòng 3D
            </span>
          </div>
        </div>
      </div>

      {/* Thẻ 3: Hợp Đồng Sắp Hết */}
      <div className="p-6 rounded-3xl bg-amber-50/70 backdrop-blur-md border border-amber-200/50 shadow-[0_8px_30px_rgb(245,158,11,0.04)] hover:shadow-md transition flex flex-col justify-between">
        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
          Hợp Đồng Sắp Hết
        </span>
        <div className="my-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            3
          </h3>
        </div>
        <span className="text-[11px] font-bold text-amber-700">
          phòng cần gia hạn
        </span>
      </div>

      {/* Thẻ 4: Yêu Cầu Chờ Duyệt */}
      <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-md transition flex flex-col justify-between">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Yêu Cầu Chờ Duyệt
        </span>
        <div className="my-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">
            2
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-500">
          khách đăng ký mới
        </span>
      </div>
    </div>
  );
}
