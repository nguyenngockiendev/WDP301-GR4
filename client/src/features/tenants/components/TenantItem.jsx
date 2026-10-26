import React from 'react';

export default function TenantItem({ tenant }) {
  return (
    <div className="tenant-details p-4 bg-light">
      <div className="row mb-4">
        <div className="col-md-6">
          <p>
            <strong>Email:</strong> {tenant.email}
          </p>
          <p>
            <strong>Điện Thoại:</strong> {tenant.phone || 'Không có'}
          </p>
        </div>
      </div>

      <div className="contracts-section">
        <h6 className="mb-3">Hợp Đồng Hoạt Động ({tenant.contracts?.length || 0})</h6>

        {tenant.contracts && tenant.contracts.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Phòng</th>
                  <th>Ngày Bắt Đầu</th>
                  <th>Ngày Kết Thúc</th>
                  <th>Tiền Thuê/Tháng</th>
                </tr>
              </thead>
              <tbody>
                {tenant.contracts.map((contract, index) => (
                  <tr key={index}>
                    <td className="fw-bold">
                      Phòng {contract.room?.roomNumber || 'N/A'}
                    </td>
                    <td>
                      {new Date(contract.startDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      {new Date(contract.endDate).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      {Number(contract.monthlyRent).toLocaleString()} VNĐ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted mb-0">Không có hợp đồng hoạt động</p>
        )}
      </div>
    </div>
  );
}
