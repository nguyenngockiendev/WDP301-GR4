import React from 'react';
import { CalendarDays, FileText, MapPin, X } from 'lucide-react';
import CheckoutStatusBadge from './CheckoutStatusBadge';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
};

export default function CheckoutRequestDetail({ request, onClose }) {
  if (!request) return null;
  const contract = request.contract || {};
  const room = contract.room || {};
  const settlement = request.checkoutSettlement;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-600">Chi tiết yêu cầu</p>
            <h2 className="mt-1 text-xl font-black text-slate-800">Yêu cầu trả phòng</h2>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng"><X size={20} /></button>
        </div>
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
          <span className="text-sm font-bold text-slate-600">Trạng thái hiện tại</span>
          <CheckoutStatusBadge status={request.status} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 p-4"><MapPin size={17} className="mb-2 text-emerald-600" /><p className="text-xs text-slate-400">Phòng</p><p className="mt-1 font-extrabold text-slate-800">{room.roomNumber || 'Chưa có dữ liệu'}</p></div>
          <div className="rounded-2xl border border-slate-100 p-4"><FileText size={17} className="mb-2 text-emerald-600" /><p className="text-xs text-slate-400">Mã hợp đồng</p><p className="mt-1 break-all font-extrabold text-slate-800">{contract._id || '—'}</p></div>
          <div className="rounded-2xl border border-slate-100 p-4"><CalendarDays size={17} className="mb-2 text-emerald-600" /><p className="text-xs text-slate-400">Thời gian gửi</p><p className="mt-1 font-extrabold text-slate-800">{formatDateTime(request.requestedDate || request.createdAt)}</p></div>
          <div className="rounded-2xl border border-slate-100 p-4"><CalendarDays size={17} className="mb-2 text-amber-500" /><p className="text-xs text-slate-400">Ngày dự kiến rời phòng</p><p className="mt-1 font-extrabold text-slate-800">{formatDate(request.moveOutDate)}</p></div>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-100 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Lý do trả phòng</p>
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{request.reason || 'Không có nội dung.'}</p>
        </div>
        {settlement?.refundConfirmedAt && settlement.refundProofImage && (
          <div className="mt-4 rounded-2xl border border-emerald-100 p-4">
            <p className="text-sm font-bold text-emerald-800">Đã hoàn cọc {Number(settlement.refundAmount).toLocaleString('vi-VN')} ₫</p>
            <p className="mt-1 text-xs text-slate-500">Xác nhận lúc {formatDateTime(settlement.refundConfirmedAt)}</p>
            <img src={settlement.refundProofImage} alt="Biên lai chuyển khoản hoàn cọc" className="mt-3 max-h-64 max-w-full rounded-lg border border-slate-200 object-contain" />
          </div>
        )}
        <p className="mt-5 text-xs leading-5 text-slate-400">Trạng thái được hiển thị theo dữ liệu backend. Nếu landlord chưa xử lý, yêu cầu sẽ tiếp tục ở trạng thái đang chờ.</p>
      </div>
    </div>
  );
}
