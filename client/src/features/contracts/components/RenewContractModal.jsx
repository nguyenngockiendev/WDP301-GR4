import React, { useState } from 'react';

export default function RenewContractModal({ contract, onClose, onRenew }) {
  const [newEndDate, setNewEndDate] = useState(
    new Date(contract.endDate).toISOString().split('T')[0],
  );
  const [loading, setLoading] = useState(false);

  const handleRenew = async () => {
    if (!newEndDate) {
      alert('Vui lòng chọn ngày kết thúc');
      return;
    }

    const newDate = new Date(newEndDate);
    const currentEnd = new Date(contract.endDate);
    if (newDate <= currentEnd) {
      alert('Ngày kết thúc mới phải sau ngày hiện tại');
      return;
    }

    try {
      setLoading(true);
      await onRenew(newEndDate);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Gia Hạn Hợp Đồng - Phòng {contract.room?.roomNumber}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            <p className="mb-3">
              <strong>Ngày Kết Thúc Hiện Tại:</strong>{' '}
              {new Date(contract.endDate).toLocaleDateString('vi-VN')}
            </p>

            <div className="mb-3">
              <label className="form-label">Ngày Kết Thúc Mới *</label>
              <input
                type="date"
                className="form-control"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                disabled={loading}
              />
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
              className="btn btn-success"
              onClick={handleRenew}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Gia Hạn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
