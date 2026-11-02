import React from 'react';

export default function RoomStatusBadge({ status, onClick }) {
  const statusConfig = {
    available: { bg: 'success', label: 'Khả Dụng' },
    occupied: { bg: 'danger', label: 'Có Người Ở' },
    reserved: { bg: 'warning', label: 'Đã Đặt' },
    maintenance: { bg: 'secondary', label: 'Bảo Trì' },
  };

  const config = statusConfig[status] || { bg: 'secondary', label: status };

  return (
    <span
      className={`badge bg-${config.bg}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {config.label}
    </span>
  );
}
