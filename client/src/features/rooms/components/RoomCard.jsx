import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoomCard({ room }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/rooms/${room._id}`);
  };

  return (
    <div className="card room-card h-100 shadow-sm">
      {room.images && room.images.length > 0 && (
        <img src={room.images[0]} className="card-img-top" alt={room.roomNumber} />
      )}

      <div className="card-body">
        <h5 className="card-title">Phòng {room.roomNumber}</h5>

        <p className="card-text text-muted mb-2">
          <small>{room.property?.name || 'Tòa nhà'}</small>
        </p>

        <div className="room-info mb-3">
          <div className="info-item">
            <strong>{room.area} m²</strong>
            <span className="text-muted">Diện tích</span>
          </div>
          <div className="info-item">
            <strong>{Number(room.price).toLocaleString()} VNĐ</strong>
            <span className="text-muted">/tháng</span>
          </div>
        </div>

        {room.facilities && room.facilities.length > 0 && (
          <div className="mb-3">
            <small className="text-muted">Tiện nghi:</small>
            <div className="facilities">
              {room.facilities.slice(0, 3).map((facility, index) => (
                <span key={index} className="badge bg-light text-dark me-1 mb-1">
                  {facility}
                </span>
              ))}
              {room.facilities.length > 3 && (
                <span className="badge bg-light text-dark">+{room.facilities.length - 3}</span>
              )}
            </div>
          </div>
        )}

        <button
          className="btn btn-primary w-100"
          onClick={handleViewDetails}
        >
          Xem Chi Tiết
        </button>
      </div>
    </div>
  );
}
