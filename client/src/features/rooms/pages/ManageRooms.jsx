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
  const [tierFilter, setTierFilter] = useState('all');

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
        <>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-sm"><span className="text-sm font-bold text-slate-700">Danh sách phòng: {rooms.length}</span><label className="flex items-center gap-2 text-sm text-slate-600">Phân hạng<select value={tierFilter} onChange={event => setTierFilter(event.target.value)} className="rounded-lg border bg-white px-3 py-2"><option value="all">Tất cả hạng</option><option value="basic">Cơ bản</option><option value="standard">Tiêu chuẩn</option><option value="premium">Cao cấp</option></select></label></div>
        <RoomList
          rooms={rooms.filter(room => tierFilter === 'all' || (room.tier || 'standard') === tierFilter)}
          onEdit={handleEditRoom}
          onDeactivate={handleDeactivateRoom}
        />
        </>
      )}
    </div>
  );
}
