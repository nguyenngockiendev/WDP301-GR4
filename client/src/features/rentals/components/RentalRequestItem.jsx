import React, { useState } from 'react';

export default function RentalRequestItem({ request, onProcess }) {
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    if (window.confirm('Xác nhận phê duyệt yêu cầu này?')) {
      onProcess(request._id, 'approved');
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    if (window.confirm('Xác nhận từ chối yêu cầu này?')) {
      onProcess(request._id, 'rejected', rejectReason);
      setShowRejectReason(false);
      setRejectReason('');
    }
  };

  const statusConfig = {
    pending: { bg: 'warning', label: 'Chờ Xử Lý' },
    approved: { bg: 'success', label: 'Đã Phê Duyệt' },
    rejected: { bg: 'danger', label: 'Từ Chối' },
    cancelled: { bg: 'secondary', label: 'Đã Hủy' },
  };

  const config = statusConfig[request.status] || { bg: 'secondary', label: request.status };

  return (
    <div className="card rental-request-item shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="card-title mb-1">
              {request.tenant?.fullName || 'Người thuê'}
            </h5>
            <small className="text-muted">
              Phòng {request.room?.roomNumber || 'N/A'}
            </small>
          </div>
          <span className={`badge bg-${config.bg}`}>{config.label}</span>
        </div>

        <div className="request-details mb-3">
          <p className="mb-2">
            <strong>Email:</strong> {request.tenant?.email || 'N/A'}
          </p>
          <p className="mb-2">
            <strong>Điện Thoại:</strong> {request.tenant?.phone || 'N/A'}
          </p>
          <p className="mb-2">
            <strong>Ngày Dự Kiến:</strong>{' '}
            {new Date(request.expectedDate).toLocaleDateString('vi-VN')}
          </p>
          {request.note && (
            <p className="mb-2">
              <strong>Ghi Chú:</strong> {request.note}
            </p>
          )}
          {request.rejectReason && (
            <p className="mb-2 text-danger">
              <strong>Lý Do Từ Chối:</strong> {request.rejectReason}
            </p>
          )}
        </div>

        {request.status === 'pending' && (
          <>
            {!showRejectReason ? (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-success"
                  onClick={handleApprove}
                >
                  Phê Duyệt
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => setShowRejectReason(true)}
                >
                  Từ Chối
                </button>
              </div>
            ) : (
              <div className="reject-reason-form">
                <textarea
                  className="form-control form-control-sm mb-2"
                  placeholder="Nhập lý do từ chối..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows="2"
                ></textarea>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={handleReject}
                  >
                    Xác Nhận Từ Chối
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setShowRejectReason(false);
                      setRejectReason('');
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
