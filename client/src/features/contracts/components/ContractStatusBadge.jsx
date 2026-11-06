import React from 'react';

export const CONTRACT_STATUS = {
  active: { label: 'Đang hiệu lực', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  draft: { label: 'Nháp', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  expired: { label: 'Hết hạn', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  terminated: { label: 'Đã kết thúc', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

export default function ContractStatusBadge({ status }) {
  const c = CONTRACT_STATUS[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
