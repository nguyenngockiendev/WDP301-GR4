import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import RoomList from '../components/RoomList';
import RoomForm from '../components/RoomForm';
import roomsAPI from '../api/rooms-api';
import '../style/rooms.css';

export default function ManageRooms() {
  const { propertyId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, [propertyId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRoomsByProperty(propertyId);
      setRooms(response.data || []);
    } catch (error) {
      toast.error('Lỗi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setShowForm(true);
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRoom(null);
  };

  const handleSaveRoom = async (formData) => {
    try {
      if (selectedRoom) {
        await roomsAPI.updateRoom(selectedRoom._id, formData);
        toast.success('Cập nhật phòng thành công');
      } else {
        formData.property = propertyId;
        await roomsAPI.createRoom(formData);
        toast.success('Tạo phòng thành công');
      }
      fetchRooms();
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu phòng');
    }
  };

  const handleDeactivateRoom = async (roomId) => {
    if (window.confirm('Xác nhận vô hiệu hóa phòng?')) {
      try {
        await roomsAPI.deactivateRoom(roomId);
        toast.success('Vô hiệu hóa phòng thành công');
        fetchRooms();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi vô hiệu hóa phòng');
      }
    }
  };

  return (
    <div className="manage-rooms-container">
      <div className="rooms-header">
        <h2>Quản Lý Phòng</h2>
        <button className="btn btn-primary" onClick={handleAddRoom}>
          + Thêm Phòng Mới
        </button>
      </div>

      {showForm && (
        <div className="room-form-container">
          <RoomForm
            room={selectedRoom}
            onSubmit={handleSaveRoom}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {loading ? (
        <p className="text-center">Đang tải...</p>
      ) : (
        <RoomList
          rooms={rooms}
          onEdit={handleEditRoom}
          onDeactivate={handleDeactivateRoom}
        />
      )}
    </div>
  );
}
