import React, { useState } from 'react';
import { toast } from 'react-toastify';
import roomsAPI from '../api/rooms-api';

export default function RoomStatusModal({ room, onClose, onStatusChanged }) {
  const [newStatus, setNewStatus] = useState(room.status);
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'available', label: 'Khả Dụng' },
    { value: 'occupied', label: 'Có Người Ở' },
    { value: 'reserved', label: 'Đã Đặt' },
    { value: 'maintenance', label: 'Bảo Trì' },
  ];

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
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Cập Nhật Trạng Thái Phòng {room.roomNumber}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Trạng Thái</label>
              <select
                className="form-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={loading}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
