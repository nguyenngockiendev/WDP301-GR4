import React from 'react';

export const ROOM_STATUS = {
  available: { label: 'Khả Dụng', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  occupied: { label: 'Có Người Ở', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  reserved: { label: 'Đã Đặt', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  maintenance: { label: 'Bảo Trì', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

export default function RoomStatusBadge({ status, onClick }) {
  const config = ROOM_STATUS[status] || { label: status || '—', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  const Tag = onClick ? 'button' : 'span';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={onClick ? 'Bấm để đổi trạng thái' : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap transition ${config.cls} ${
        onClick ? 'cursor-pointer hover:shadow-sm hover:-translate-y-px' : ''
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Tag>
  );
}
