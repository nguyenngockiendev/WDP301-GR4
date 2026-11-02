import React, { useState } from 'react';
import RoomStatusBadge from './RoomStatusBadge';
import RoomStatusModal from './RoomStatusModal';

export default function RoomList({ rooms, onEdit, onDeactivate }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const handleStatusChange = (room) => {
    setSelectedRoom(room);
    setShowStatusModal(true);
  };

  return (
    <div className="room-list">
      {rooms.length === 0 ? (
        <div className="alert alert-info">Chưa có phòng nào</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-light">
              <tr>
                <th>Số Phòng</th>
                <th>Diện Tích</th>
                <th>Giá Thuê</th>
                <th>Trạng Thái</th>
                <th>Tiện Nghi</th>
                <th>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room._id}>
                  <td className="fw-bold">{room.roomNumber}</td>
                  <td>{room.area} m²</td>
                  <td>{Number(room.price).toLocaleString()} VNĐ</td>
                  <td>
                    <RoomStatusBadge
                      status={room.status}
                      onClick={() => handleStatusChange(room)}
                    />
                  </td>
                  <td>
                    {room.facilities?.length > 0 ? (
                      <span className="badge bg-secondary">{room.facilities.length} tiện nghi</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => onEdit(room)}
                        title="Chỉnh sửa"
                      >
                        ✎
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => onDeactivate(room._id)}
                        title="Vô hiệu hóa"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showStatusModal && selectedRoom && (
        <RoomStatusModal
          room={selectedRoom}
          onClose={() => setShowStatusModal(false)}
          onStatusChanged={() => {
            setShowStatusModal(false);
          }}
        />
      )}
    </div>
  );
}
