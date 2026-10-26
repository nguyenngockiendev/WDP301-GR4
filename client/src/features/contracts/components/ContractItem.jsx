import React, { useState } from 'react';
import { toast } from 'react-toastify';
import contractsAPI from '../api/contracts-api';
import RenewContractModal from './RenewContractModal';
import ChangeRepresentativeModal from './ChangeRepresentativeModal';

export default function ContractItem({ contract, onEdit, onRefresh }) {
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showChangeRepModal, setShowChangeRepModal] = useState(false);

  const statusConfig = {
    active: { bg: 'success', label: 'Hoạt Động' },
    expired: { bg: 'danger', label: 'Hết Hạn' },
    terminated: { bg: 'secondary', label: 'Kết Thúc' },
    draft: { bg: 'warning', label: 'Nháp' },
  };

  const config = statusConfig[contract.status] || { bg: 'secondary', label: contract.status };

  const handleRenew = async (newEndDate) => {
    try {
      await contractsAPI.renewContract(contract._id, newEndDate);
      toast.success('Gia hạn hợp đồng thành công');
      setShowRenewModal(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gia hạn hợp đồng');
    }
  };

  const handleChangeRepresentative = async (newRepresentativeId) => {
    try {
      await contractsAPI.changeRepresentative(contract._id, newRepresentativeId);
      toast.success('Thay đổi người đại diện thành công');
      setShowChangeRepModal(false);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi thay đổi người đại diện');
    }
  };

  return (
    <>
      <div className="card contract-item shadow-sm h-100">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="card-title mb-1">
                Phòng {contract.room?.roomNumber || 'N/A'}
              </h5>
              <small className="text-muted">
                {contract.room?.property?.name || 'Tòa nhà'}
              </small>
            </div>
            <span className={`badge bg-${config.bg}`}>{config.label}</span>
          </div>

          <div className="contract-details">
            <p className="mb-2">
              <strong>Người Đại Diện:</strong> {contract.representative?.fullName || 'N/A'}
            </p>
            <p className="mb-2">
              <strong>Ngày Bắt Đầu:</strong>{' '}
              {new Date(contract.startDate).toLocaleDateString('vi-VN')}
            </p>
            <p className="mb-2">
              <strong>Ngày Kết Thúc:</strong>{' '}
              {new Date(contract.endDate).toLocaleDateString('vi-VN')}
            </p>
            <p className="mb-2">
              <strong>Tiền Thuê:</strong> {Number(contract.monthlyRent).toLocaleString()} VNĐ/tháng
            </p>
            {contract.depositAmount > 0 && (
              <p className="mb-2">
                <strong>Đặt Cọc:</strong> {Number(contract.depositAmount).toLocaleString()} VNĐ
              </p>
            )}
          </div>

          <div className="mt-3 btn-group btn-group-sm w-100" role="group">
            <button
              className="btn btn-outline-primary"
              onClick={() => onEdit(contract)}
              title="Chỉnh sửa"
            >
              ✎ Sửa
            </button>
            {contract.status === 'active' && (
              <>
                <button
                  className="btn btn-outline-success"
                  onClick={() => setShowRenewModal(true)}
                  title="Gia hạn"
                >
                  ⟲ Gia Hạn
                </button>
                <button
                  className="btn btn-outline-info"
                  onClick={() => setShowChangeRepModal(true)}
                  title="Đổi đại diện"
                >
                  👤 Đổi ĐĐ
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showRenewModal && (
        <RenewContractModal
          contract={contract}
          onClose={() => setShowRenewModal(false)}
          onRenew={handleRenew}
        />
      )}

      {showChangeRepModal && (
        <ChangeRepresentativeModal
          contract={contract}
          onClose={() => setShowChangeRepModal(false)}
          onChange={handleChangeRepresentative}
        />
      )}
    </>
  );
}
