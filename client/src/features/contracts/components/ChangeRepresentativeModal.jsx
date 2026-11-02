import React, { useState } from 'react';

export default function ChangeRepresentativeModal({ contract, onClose, onChange }) {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [loading, setLoading] = useState(false);

  const allMembers = [
    { _id: contract.representative._id, fullName: contract.representative.fullName, isCurrent: true },
    ...contract.otherMembers.map(member => ({ ...member, isCurrent: false })),
  ];

  const handleChange = async () => {
    if (!selectedMemberId) {
      alert('Vui lòng chọn người đại diện');
      return;
    }

    if (selectedMemberId === contract.representative._id) {
      alert('Vui lòng chọn một người khác');
      return;
    }

    try {
      setLoading(true);
      await onChange(selectedMemberId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Thay Đổi Người Đại Diện - Phòng {contract.room?.roomNumber}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            <p className="mb-3">
              <strong>Người Đại Diện Hiện Tại:</strong> {contract.representative?.fullName}
            </p>

            {allMembers.length <= 1 ? (
              <div className="alert alert-warning">
                Hợp đồng chỉ có 1 thành viên. Vui lòng thêm thành viên khác trước.
              </div>
            ) : (
              <div className="mb-3">
                <label className="form-label">Chọn Người Đại Diện Mới *</label>
                <select
                  className="form-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">-- Chọn thành viên --</option>
                  {allMembers.map(member => (
                    <option key={member._id} value={member._id}>
                      {member.fullName} {member.isCurrent ? '(Hiện tại)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              onClick={handleChange}
              disabled={loading || allMembers.length <= 1}
            >
              {loading ? 'Đang xử lý...' : 'Thay Đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
