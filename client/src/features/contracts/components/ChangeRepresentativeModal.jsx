import React, { useState } from 'react';
import { Crown } from 'lucide-react';
import Modal, { btnPrimary, btnGhost } from '../../../shared/components/Modal';

export default function ChangeRepresentativeModal({ contract, onClose, onChange }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  const currentId = contract.representative?._id;
  const members = [
    { ...contract.representative, isCurrent: true },
    ...(contract.otherMembers || []).map(m => ({ ...m, isCurrent: false })),
  ].filter(m => m?._id);

  const handleChange = async () => {
    if (!selectedMemberId || selectedMemberId === currentId) return;
    try {
      setLoading(true);
      await onChange(selectedMemberId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Đổi người đại diện"
      subtitle={`Phòng ${contract.room?.roomNumber || ''}`}
      onClose={onClose}
      disabled={loading}
      maxWidth="max-w-md"
      footer={
        <>
          <button className={btnGhost} onClick={onClose} disabled={loading}>Hủy</button>
          <button
            className={btnPrimary}
            onClick={handleChange}
            disabled={loading || !selectedMemberId || selectedMemberId === currentId}
          >
            {loading ? 'Đang lưu...' : 'Xác nhận'}
          </button>
        </>
      }
    >
      {members.length <= 1 ? (
        <p className="text-xs font-semibold text-slate-500 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          Hợp đồng chỉ có một thành viên. Hãy thêm người ở cùng trước khi đổi người đại diện.
        </p>
      ) : (
        <div className="space-y-2">
          {members.map(m => {
            const active = selectedMemberId === m._id;
            return (
              <button
                key={m._id}
                type="button"
                disabled={m.isCurrent || loading}
                onClick={() => setSelectedMemberId(m._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                  m.isCurrent
                    ? 'border-slate-100 bg-slate-50 cursor-default'
                    : active
                      ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100 cursor-pointer'
                      : 'border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {(m.fullName || '?').trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-slate-800 truncate">{m.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{m.phone || m.email}</p>
                </div>
                {m.isCurrent && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                    <Crown size={11} /> Hiện tại
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
