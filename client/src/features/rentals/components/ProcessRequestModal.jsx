import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Modal, { btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

const QUICK_REASONS = ['Phòng đã có người đặt trước', 'Thông tin chưa đầy đủ', 'Ngày dọn vào không phù hợp', 'Không đáp ứng điều kiện thuê'];

/** Popup xác nhận phê duyệt / từ chối yêu cầu thuê. action: 'approved' | 'rejected' */
export default function ProcessRequestModal({ request, action, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isApprove = action === 'approved';

  const handleConfirm = async () => {
    if (!isApprove && !reason.trim()) return setError('Vui lòng nhập lý do từ chối');
    try {
      setLoading(true);
      await onConfirm(reason.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isApprove ? 'Phê duyệt yêu cầu thuê' : 'Từ chối yêu cầu thuê'}
      subtitle={`${request.tenant?.fullName || 'Người thuê'} · Phòng ${request.room?.roomNumber || ''}`}
      onClose={onClose}
      disabled={loading}
      maxWidth="max-w-md"
      footer={
        <>
          <button className={btnGhost} onClick={onClose} disabled={loading}>Hủy</button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-xl active:scale-95 text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:opacity-60 ${
              isApprove
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-emerald-600/20'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
            }`}
          >
            {loading ? 'Đang xử lý...' : isApprove ? 'Phê duyệt' : 'Từ chối'}
          </button>
        </>
      }
    >
      {isApprove ? (
        <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p>
              Phòng <b className="text-slate-900">{request.room?.roomNumber}</b> (
              {formatCurrency(request.room?.price)}/tháng) sẽ chuyển sang trạng thái <b>Đã đặt</b>.
            </p>
            <p>Ngày dọn vào dự kiến: <b className="text-slate-900">{formatDate(request.expectedDate)}</b>.</p>
            <p>Sau khi duyệt, bạn có thể tạo hợp đồng từ yêu cầu này.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-100 mb-4">
            <XCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">Người thuê sẽ thấy lý do từ chối này.</p>
          </div>
          <label className={labelCls}>Lý do nhanh</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_REASONS.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => { setReason(r); setError(''); }}
                className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                  reason === r ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600 hover:border-rose-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <label className={labelCls}>Lý do từ chối *</label>
          <textarea
            rows="3"
            className={`${inputCls} resize-none`}
            placeholder="Nhập lý do..."
            value={reason}
            onChange={e => { setReason(e.target.value); setError(''); }}
            disabled={loading}
          />
          {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-500">{error}</p>}
        </>
      )}
    </Modal>
  );
}
