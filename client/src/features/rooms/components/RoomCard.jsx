import RoomImage from './RoomImage';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ImageOff, Ruler, Users } from 'lucide-react';

export default function RoomCard({ room }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/rooms/${room._id}`);
  };
  const tierNames = { basic: 'Cơ bản', standard: 'Tiêu chuẩn', premium: 'Cao cấp' };

  return (
    <div className="h-full flex flex-col rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition">
      {room.images && room.images.length > 0 ? (
        <RoomImage src={room.images[0]} className="w-full h-40 object-cover" alt={`Phòng ${room.roomNumber}`} />
      ) : (
        <div className="w-full h-40 bg-slate-100/70 flex items-center justify-center text-slate-300">
          <ImageOff size={28} />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        <h5 className="text-base font-black text-slate-900">Phòng {room.roomNumber}</h5>
        <p className="text-[11px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1 truncate">
          <Building2 size={12} /> {room.property?.name || 'Tòa nhà'}
        </p>

        <p className="mt-3 text-lg font-black text-emerald-600">
          {Number(room.price || 0).toLocaleString('vi-VN')} đ
          <span className="text-xs font-semibold text-slate-400"> /tháng</span>
        </p>

        <div className="mt-2 flex gap-3 text-[11px] font-bold text-slate-500">
          <span className="flex items-center gap-1">
            <Ruler size={12} /> {room.area} m²
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} /> Tối đa {room.maxTenants || 1} người
          </span>
        </div>
        <p className="small text-muted">Khoảng {room.area ? Math.round(Number(room.price) / Number(room.area)).toLocaleString('vi-VN') : '—'} đ/m²/tháng · Điện, nước tính theo mức sử dụng.</p>

        {room.facilities && room.facilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {room.facilities.slice(0, 3).map((facility, index) => (
              <span key={index} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                {facility}
              </span>
            ))}
            {room.facilities.length > 3 && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                +{room.facilities.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-4">
          <button
            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
            onClick={handleViewDetails}
          >
            Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  );
}
