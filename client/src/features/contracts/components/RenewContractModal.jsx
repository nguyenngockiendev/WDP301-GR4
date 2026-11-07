import React, { useState } from 'react';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import { formatDate } from '../../../shared/utils/format';

const toInputDate = d => new Date(d).toISOString().split('T')[0];

const addMonths = (date, months) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return toInputDate(d);
};

export default function RenewContractModal({ contract, onClose, onRenew }) {
  const [newEndDate, setNewEndDate] = useState(addMonths(contract.endDate, 6));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    if (!newEndDate) return setError('Vui lòng chọn ngày kết thúc');
    if (new Date(newEndDate) <= new Date(contract.endDate)) {
      return setError('Ngày kết thúc mới phải sau ngày kết thúc hiện tại');
    }
    setError('');
    try {
      setLoading(true);
      await onRenew(newEndDate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Gia hạn hợp đồng"
      subtitle={`Phòng ${contract.room?.roomNumber || ''} · ${contract.representative?.fullName || ''}`}
      onClose={onClose}
      disabled={loading}
      maxWidth="max-w-md"
      footer={
        <>
          <button className={btnGhost} onClick={onClose} disabled={loading}>Hủy</button>
          <button className={btnPrimary} onClick={handleRenew} disabled={loading}>
            {loading ? 'Đang gia hạn...' : 'Gia hạn'}
          </button>
        </>
      }
    >
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs mb-4">
        <span className="text-slate-400 font-semibold">Ngày kết thúc hiện tại: </span>
        <span className="font-extrabold text-slate-800">{formatDate(contract.endDate)}</span>
      </div>

      <label className={labelCls}>Gia hạn nhanh</label>
      <div className="flex gap-2 mb-4">
        {[3, 6, 12].map(m => {
          const value = addMonths(contract.endDate, m);
          const active = value === newEndDate;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setNewEndDate(value)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                active
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                  : 'border-slate-200 text-slate-600 hover:border-emerald-200'
              }`}
            >
              +{m} tháng
            </button>
          );
        })}
      </div>

      <label className={labelCls}>Ngày kết thúc mới *</label>
      <input
        type="date"
        className={inputCls}
        value={newEndDate}
        min={toInputDate(new Date(contract.endDate).getTime() + 86400000)}
        onChange={e => setNewEndDate(e.target.value)}
        disabled={loading}
      />
      {error && <p className="mt-1.5 text-[11px] font-semibold text-rose-500">{error}</p>}
    </Modal>
  );
}
