import React from 'react';
import { Users, Crown, ChevronRight, Phone, Mail } from 'lucide-react';
import { initials } from './TenantItem';
import { formatDate } from '../../../shared/utils/format';

const DAY = 24 * 60 * 60 * 1000;

export default function TenantList({ tenants, onSelect }) {
  if (tenants.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Users size={26} />
        </div>
        <p className="text-sm font-extrabold text-slate-800">Không có người thuê nào</p>
        <p className="text-xs text-slate-400 mt-1">Người thuê sẽ xuất hiện khi có hợp đồng đang hiệu lực.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wide">
            <th className="pb-3 px-3">Người thuê</th>
            <th className="pb-3 px-3">Liên hệ</th>
            <th className="pb-3 px-3">Phòng</th>
            <th className="pb-3 px-3">Vai trò</th>
            <th className="pb-3 px-3">Hết hạn HĐ</th>
            <th className="pb-3 px-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/70 font-medium">
          {tenants.map(t => {
            const nearestEnd = t.contracts
              .map(c => new Date(c.endDate))
              .sort((a, b) => a - b)[0];
            const daysLeft = nearestEnd ? Math.ceil((nearestEnd - Date.now()) / DAY) : null;
            const soon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;

            return (
              <tr
                key={t._id}
                onClick={() => onSelect(t)}
                className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white text-[11px] font-black flex items-center justify-center shadow-sm shrink-0">
                      {initials(t.fullName)}
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">{t.fullName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <p className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Phone size={12} className="text-slate-400" /> {t.phone || '—'}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                    <Mail size={12} /> {t.email}
                  </p>
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex flex-wrap gap-1">
                    {t.contracts.map(c => (
                      <span
                        key={c.contractId}
                        className="px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-800 text-[11px] font-bold"
                      >
                        {c.room?.roomNumber || 'N/A'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  {t.isRepresentative ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                      <Crown size={12} /> Đại diện
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-bold">
                      <Users size={12} /> Ở cùng
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-3">
                  <p className="font-bold text-slate-700">{nearestEnd ? formatDate(nearestEnd) : '—'}</p>
                  {soon && <p className="text-[10px] font-bold text-amber-600 mt-0.5">Còn {daysLeft} ngày</p>}
                </td>
                <td className="py-3.5 px-3 text-right">
                  <ChevronRight size={16} className="inline text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
