import React, { useState } from 'react';
import { toast } from 'react-toastify';
import roomsAPI from '../api/rooms-api';
import Modal, { btnPrimary, btnGhost } from './Modal';
import { ROOM_STATUS } from './RoomStatusBadge';

export default function RoomStatusModal({ room, onClose, onStatusChanged }) {
  const [newStatus, setNewStatus] = useState(room.status);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (newStatus === room.status) {
      onClose();
      return;
    }
    try {
      setLoading(true);
      await roomsAPI.updateRoomStatus(room._id, newStatus);
      toast.success('Cập nhật trạng thái phòng thành công');
      onStatusChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Trạng thái phòng ${room.roomNumber}`}
      onClose={onClose}
      disabled={loading}
      maxWidth="max-w-md"
      footer={
        <>
          <button className={btnGhost} onClick={onClose} disabled={loading}>Hủy</button>
          <button className={btnPrimary} onClick={handleSave} disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(ROOM_STATUS).map(([value, cfg]) => {
          const active = newStatus === value;
          return (
            <button
              key={value}
              type="button"
              disabled={loading}
              onClick={() => setNewStatus(value)}
              className={`flex items-center gap-2 px-3.5 py-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                active
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                  : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
