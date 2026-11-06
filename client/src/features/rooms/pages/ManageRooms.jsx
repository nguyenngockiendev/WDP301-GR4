import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search, DoorOpen, CheckCircle2, Users, Wrench } from 'lucide-react';
import RoomList from '../components/RoomList';
import RoomForm from '../components/RoomForm';
import roomsAPI from '../api/rooms-api';
import { ROOM_STATUS } from '../components/RoomStatusBadge';

const FILTERS = [{ value: 'all', label: 'Tất cả' }, ...Object.entries(ROOM_STATUS).map(([value, c]) => ({ value, label: c.label }))];

export default function ManageRooms() {
  const { propertyId } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRoomsByProperty(propertyId);
      setRooms(response.data || []);
    } catch {
      toast.error('Lỗi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const count = s => rooms.filter(r => r.status === s).length;
    return [
      { label: 'Tổng số phòng', value: rooms.length, icon: DoorOpen, cls: 'from-emerald-500 to-teal-400' },
      { label: 'Đang trống', value: count('available'), icon: CheckCircle2, cls: 'from-green-500 to-emerald-400' },
      { label: 'Có người ở', value: count('occupied'), icon: Users, cls: 'from-sky-500 to-cyan-400' },
      { label: 'Đặt trước / Bảo trì', value: count('reserved') + count('maintenance'), icon: Wrench, cls: 'from-amber-500 to-orange-400' },
    ];
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rooms.filter(
      r =>
        (statusFilter === 'all' || r.status === statusFilter) &&
        (!kw || String(r.roomNumber).toLowerCase().includes(kw)),
    );
  }, [rooms, keyword, statusFilter]);

  const openForm = (room = null) => {
    setSelectedRoom(room);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedRoom(null);
  };

  const handleSaveRoom = async formData => {
    try {
      if (selectedRoom) {
        await roomsAPI.updateRoom(selectedRoom._id, formData);
        toast.success('Cập nhật phòng thành công');
      } else {
        await roomsAPI.createRoom({ ...formData, property: propertyId });
        toast.success('Tạo phòng thành công');
      }
      fetchRooms();
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu phòng');
    }
  };

  const handleDeactivateRoom = async roomId => {
    if (!window.confirm('Xác nhận vô hiệu hóa phòng?')) return;
    try {
      await roomsAPI.deactivateRoom(roomId);
      toast.success('Vô hiệu hóa phòng thành công');
      fetchRooms();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi vô hiệu hóa phòng');
    }
  };

  const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Quản lý phòng</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">Theo dõi trạng thái, giá thuê và tiện nghi của từng phòng</p>
        </div>
        <button
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer self-start"
        >
          <Plus size={16} className="stroke-[2.5]" />
          Thêm phòng mới
        </button>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${card} p-4 flex items-center gap-3.5`}>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${s.cls} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 truncate">{s.label}</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bảng phòng */}
      <div className={`${card} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  statusFilter === f.value
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'bg-slate-100/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="Tìm số phòng..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:bg-white transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-xl bg-slate-100/70 animate-pulse" />
            ))}
          </div>
        ) : (
          <RoomList
            rooms={filteredRooms}
            onEdit={openForm}
            onDeactivate={handleDeactivateRoom}
            onRefresh={fetchRooms}
          />
        )}
      </div>

      {showForm && <RoomForm room={selectedRoom} onSubmit={handleSaveRoom} onCancel={handleCloseForm} />}
    </div>
  );
}
