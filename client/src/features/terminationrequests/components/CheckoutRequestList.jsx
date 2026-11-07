import React from 'react';
import { CalendarDays, FileText, MapPin } from 'lucide-react';
import CheckoutStatusBadge from './CheckoutStatusBadge';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

export default function CheckoutRequestList({ requests = [], loading = false, onSelect }) {
  if (loading) {
    return <div className="rounded-3xl border border-white bg-white/80 p-12 text-center text-sm font-semibold text-slate-500">Đang tải yêu cầu...</div>;
  }

  if (!requests.length) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-200 bg-white/70 px-6 py-14 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><FileText size={25} /></div>
        <h3 className="font-extrabold text-slate-800">Bạn chưa gửi yêu cầu trả phòng</h3>
        <p className="mt-2 text-sm text-slate-500">Các yêu cầu bạn gửi sẽ được hiển thị tại đây để tiện theo dõi.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {requests.map((item) => {
        const contract = item.contract || {};
        const room = contract.room || {};
        return (
          <button
            key={item._id}
            type="button"
            onClick={() => onSelect?.(item)}
            className="w-full rounded-3xl border border-white/90 bg-white/85 p-5 text-left shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-emerald-100 hover:shadow-lg sm:p-6"
          >
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Yêu cầu #{String(item._id || '').slice(-6) || '—'}</span>
                  <CheckoutStatusBadge status={item.status} />
                </div>
                <h3 className="text-base font-extrabold text-slate-800">Yêu cầu trả phòng</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{item.reason || 'Không có nội dung lý do.'}</p>
              </div>
              <span className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700">Xem chi tiết</span>
            </div>
            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 sm:grid-cols-4">
              <span className="flex items-center gap-2"><MapPin size={15} className="text-emerald-600" />Phòng {room.roomNumber || 'Chưa có dữ liệu'}</span>
              <span className="flex items-center gap-2"><CalendarDays size={15} className="text-emerald-600" />Ngày gửi: {formatDate(item.requestedDate || item.createdAt)}</span>
              <span className="flex items-center gap-2"><CalendarDays size={15} className="text-amber-500" />Dự kiến rời phòng: {formatDate(item.moveOutDate)}</span>
              <span className="flex items-center gap-2"><FileText size={15} className="text-emerald-600" />Hợp đồng: {contract._id ? `${String(contract._id).slice(-8)}` : '—'}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
