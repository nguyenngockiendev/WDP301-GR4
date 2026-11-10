import React, { useState } from 'react';
import { Pencil, Ban, DoorOpen, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoomStatusBadge from './RoomStatusBadge';
import RoomStatusModal from './RoomStatusModal';

export default function RoomList({ rooms, onEdit, onDeactivate, onRefresh, canEdit = true }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const navigate = useNavigate();

  if (rooms.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <DoorOpen size={26} />
        </div>
        <p className="text-sm font-extrabold text-slate-800">Không có phòng nào</p>
        <p className="text-xs text-slate-400 mt-1">Thêm phòng mới hoặc thay đổi bộ lọc.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wide">
              <th className="pb-3 px-3">Số phòng</th>
              <th className="pb-3 px-3">Diện tích</th>
              <th className="pb-3 px-3">Giá thuê</th>
              <th className="pb-3 px-3">Tối đa</th>
              <th className="pb-3 px-3">Trạng thái</th>
              <th className="pb-3 px-3">Tiện nghi</th>
              <th className="pb-3 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/70 font-medium">
            {rooms.map(room => (
              <tr key={room._id} className="hover:bg-emerald-50/40 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                      <DoorOpen size={16} />
                    </div>
                    <span className="font-extrabold text-slate-900 text-sm">{room.roomNumber}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-slate-600 font-bold">{room.area} m²</td>
                <td className="py-3.5 px-3">
                  <span className="font-black text-slate-900">{Number(room.price || 0).toLocaleString('vi-VN')}</span>
                  <span className="text-slate-400 font-semibold"> đ/tháng</span>
                </td>
                <td className="py-3.5 px-3 text-slate-600">
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Users size={13} className="text-slate-400" />
                    {room.maxTenants ?? 1}
                  </span>
                </td>
                <td className="py-3.5 px-3">
                  <RoomStatusBadge status={room.status} onClick={() => setSelectedRoom(room)} />
                </td>
                <td className="py-3.5 px-3">
                  {room.facilities?.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {room.facilities.slice(0, 3).map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {f}
                        </span>
                      ))}
                      {room.facilities.length > 3 && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          +{room.facilities.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-3.5 px-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      onClick={() => navigate(`/rooms/${room._id}`)}
                      title="Xem chi tiết"
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-center transition cursor-pointer"
                    >
                      <Eye size={14} />
                    </button>
                    {canEdit && <button
                      onClick={() => onEdit(room)}
                      title="Chỉnh sửa"
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center transition cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>}
                    {canEdit && <button
                      onClick={() => onDeactivate(room._id)}
                      title="Vô hiệu hóa"
                      className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                    >
                      <Ban size={14} />
                    </button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRoom && (
        <RoomStatusModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onStatusChanged={() => {
            setSelectedRoom(null);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
