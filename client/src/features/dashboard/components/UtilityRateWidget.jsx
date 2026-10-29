import React from 'react';
import { Zap, Droplets } from 'lucide-react';

export default function UtilityRateWidget() {
  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between h-full">
      <h3 className="text-sm font-extrabold text-slate-900 mb-4">
        Chốt Chỉ Số Điện Nước
      </h3>

      <div className="space-y-3.5">
        {/* Hộp Giá Điện */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Zap size={18} />
            </div>
            <span className="text-xs font-bold text-slate-700">Điện:</span>
          </div>
          <span className="text-base font-black text-slate-900">
            3.500 <span className="text-xs font-bold text-slate-500">đ/kWh</span>
          </span>
        </div>

        {/* Hộp Giá Nước */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Droplets size={18} />
            </div>
            <span className="text-xs font-bold text-slate-700">Nước:</span>
          </div>
          <span className="text-base font-black text-slate-900">
            20.000 <span className="text-xs font-bold text-slate-500">đ/m³</span>
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-bold text-emerald-800/80 text-center">
        Áp dụng toàn bộ tòa nhà • Tháng 10
      </div>
    </div>
  );
}
