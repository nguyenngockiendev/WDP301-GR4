import React, { useState } from 'react';
import { CalendarDays, Phone, Mail, MessageSquareText, DoorOpen, Check, X, FilePlus2, UserCheck } from 'lucide-react';
import RentalStatusBadge from './RentalStatusBadge';
import ProcessRequestModal from './ProcessRequestModal';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

const initials = name =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map(w => w.charAt(0).toUpperCase())
    .join('');

export default function RentalRequestItem({ request, onProcess, onCreateContract }) {
  const [action, setAction] = useState(null); // 'approved' | 'rejected' | null

  const handleConfirm = async reason => {
    const ok = await onProcess(request._id, action, reason);
    if (ok) setAction(null);
  };

  return (
    <>
      <div className="h-full flex flex-col p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.10)] hover:-translate-y-0.5 transition-all">
        {/* Người thuê */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white text-xs font-black flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              {initials(request.tenant?.fullName)}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-slate-900 truncate">{request.tenant?.fullName || 'Người thuê'}</h4>
              <p className="text-[11px] font-semibold text-slate-400">Gửi lúc {formatDate(request.createdAt)}</p>
            </div>
          </div>
          <RentalStatusBadge status={request.status} />
        </div>

        {/* Phòng */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DoorOpen size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-800">Phòng {request.room?.roomNumber || 'N/A'}</p>
            <p className="text-[11px] text-slate-500">
              {request.room?.area ? `${request.room.area} m² · ` : ''}
              <span className="font-bold text-slate-700">{formatCurrency(request.room?.price)}</span>/tháng
            </p>
          </div>
        </div>

        {/* Chi tiết */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <p className="flex items-center gap-2">
            <CalendarDays size={13} className="text-slate-400 shrink-0" />
            Dọn vào: <b className="text-slate-800">{formatDate(request.expectedDate)}</b>
          </p>
          <p className="flex items-center gap-2 truncate">
            <Phone size={13} className="text-slate-400 shrink-0" /> {request.tenant?.phone || '—'}
          </p>
          <p className="flex items-center gap-2 truncate">
            <Mail size={13} className="text-slate-400 shrink-0" /> {request.tenant?.email || '—'}
          </p>
          {request.note && (
            <p className="flex items-start gap-2 p-2.5 mt-2 rounded-xl bg-amber-50/60 border border-amber-100 text-slate-700">
              <MessageSquareText size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <span className="line-clamp-3">{request.note}</span>
            </p>
          )}
          {request.status === 'rejected' && request.rejectReason && (
            <p className="p-2.5 mt-2 rounded-xl bg-rose-50 border border-rose-100 text-rose-700">
              <b>Lý do từ chối:</b> {request.rejectReason}
            </p>
          )}
          {request.processedBy && request.status !== 'pending' && (
            <p className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <UserCheck size={12} /> Xử lý bởi {request.processedBy.fullName}
            </p>
          )}
        </div>

        {/* Thao tác */}
        <div className="mt-auto flex gap-2">
          {request.status === 'pending' && (
            <>
              <button
                onClick={() => setAction('approved')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-[11px] font-extrabold shadow-sm shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Check size={14} /> Phê duyệt
              </button>
              <button
                onClick={() => setAction('rejected')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[11px] font-bold transition cursor-pointer"
              >
                <X size={14} /> Từ chối
              </button>
            </>
          )}
          {request.status === 'approved' && (
            <button
              onClick={() => onCreateContract(request)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer"
            >
              <FilePlus2 size={14} /> Tạo hợp đồng
            </button>
          )}
        </div>
      </div>

      {action && (
        <ProcessRequestModal request={request} action={action} onClose={() => setAction(null)} onConfirm={handleConfirm} />
      )}
    </>
  );
}
