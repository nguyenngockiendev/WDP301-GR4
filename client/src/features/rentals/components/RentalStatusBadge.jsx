import React from 'react';

export const RENTAL_STATUS = {
  pending: { label: 'Chờ xử lý', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  approved: { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  cancelled: { label: 'Đã hủy', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

export default function RentalStatusBadge({ status }) {
  const c = RENTAL_STATUS[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
