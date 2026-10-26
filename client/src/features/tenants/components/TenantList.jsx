import React, { useState } from 'react';
import TenantItem from './TenantItem';

export default function TenantList({ tenants }) {
  const [expandedTenantId, setExpandedTenantId] = useState(null);

  const toggleExpand = (tenantId) => {
    setExpandedTenantId(expandedTenantId === tenantId ? null : tenantId);
  };

  return (
    <div className="tenants-list">
      {tenants.length === 0 ? (
        <div className="alert alert-info">Không có người thuê nào</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Tên Người Thuê</th>
                <th>Email</th>
                <th>Điện Thoại</th>
                <th>Số Hợp Đồng</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <React.Fragment key={tenant._id}>
                  <tr
                    onClick={() => toggleExpand(tenant._id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="fw-bold">{tenant.fullName}</td>
                    <td>{tenant.email}</td>
                    <td>{tenant.phone || '-'}</td>
                    <td>
                      <span className="badge bg-info">
                        {tenant.contracts?.length || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`chevron ${expandedTenantId === tenant._id ? 'open' : ''}`}>
                        ▼
                      </span>
                    </td>
                  </tr>

                  {expandedTenantId === tenant._id && (
                    <tr>
                      <td colSpan="5">
                        <TenantItem tenant={tenant} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
