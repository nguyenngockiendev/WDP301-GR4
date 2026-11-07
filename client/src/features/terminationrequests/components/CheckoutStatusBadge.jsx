import React from 'react';

const STATUS_CONFIG = {
  pending: { label: 'Đang chờ xử lý', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  approved: { label: 'Đã chấp nhận', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { label: 'Đã từ chối', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  completed: { label: 'Đã hoàn tất', className: 'bg-teal-50 text-teal-700 ring-teal-200' },
  cancelled: { label: 'Đã hủy', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

export default function CheckoutStatusBadge({ status }) {
  const config = STATUS_CONFIG[String(status || '').toLowerCase()] || {
    label: status || 'Chưa xác định',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${config.className}`}>
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
