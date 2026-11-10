import RoomImage from '../components/RoomImage';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Building2, MapPin, Ruler, Users, Wallet, Sparkles, Send, ImageOff } from 'lucide-react';
import roomsAPI from '../api/rooms-api';
import RoomStatusBadge from '../components/RoomStatusBadge';
import RoomStatusModal from '../components/RoomStatusModal';
import Modal from '../../../shared/components/Modal';
import SubmitRentalRequest from '../../rentals/pages/SubmitRentalRequest';
import { getCurrentUser } from '../../../shared/utils/auth';

const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

export default function RoomDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isManager = user?.role === 'landlord' || user?.role === 'manager';

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showRequest, setShowRequest] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveImage(0);
    roomsAPI
      .getRoomById(roomId)
      .then(res => {
        if (!cancelled) setRoom(res.data || null);
      })
      .catch(err => {
        if (!cancelled) toast.error(err.response?.data?.message || 'Lỗi tải thông tin phòng');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto pt-2 space-y-4">
        <div className="h-8 w-48 rounded-xl bg-slate-100/70 animate-pulse" />
        <div className="h-80 rounded-3xl bg-white/70 animate-pulse" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className={`${card} max-w-5xl mx-auto p-8 text-center`}>
        <p className="text-sm font-semibold text-slate-500">Không tìm thấy phòng.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const images = room.images || [];
  const facts = [
    { label: 'Diện tích', value: `${room.area} m²`, icon: Ruler },
    { label: 'Giá thuê', value: `${Number(room.price || 0).toLocaleString('vi-VN')} đ/tháng`, icon: Wallet },
    { label: 'Số người tối đa', value: `${room.maxTenants || 1} người`, icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pt-2">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/85 border border-white/90 shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 transition cursor-pointer"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Phòng {room.roomNumber}</h2>
              <RoomStatusBadge
                status={room.status}
                onClick={isManager ? () => setShowStatusModal(true) : undefined}
              />
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
              <Building2 size={12} /> {room.property?.name || 'Nhà trọ'}
              {room.property?.address && (
                <>
                  <span className="mx-1">·</span>
                  <MapPin size={12} /> {room.property.address}
                </>
              )}
            </p>
          </div>
        </div>

        {isManager && room.property?._id && (
          <button
            onClick={() => navigate(`/properties/${room.property._id}/rooms`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs transition cursor-pointer self-start"
          >
            Về trang quản lý phòng
          </button>
        )}
        {user?.role === 'tenant' && room.status === 'available' && (
          <button
            onClick={() => setShowRequest(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer self-start"
          >
            <Send size={14} /> Gửi yêu cầu thuê
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ảnh */}
        <div className={`${card} p-4 lg:col-span-3`}>
          {images.length > 0 ? (
            <>
              <RoomImage
                src={images[activeImage]}
                alt={`Phòng ${room.roomNumber}`}
                className="w-full h-72 object-cover rounded-2xl"
              />
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {images.map((src, i) => (
                    <button
                      key={src + i}
                      onClick={() => setActiveImage(i)}
                      className={`shrink-0 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        i === activeImage ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <RoomImage src={src} alt="" className="w-20 h-14 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-72 rounded-2xl bg-slate-100/70 flex flex-col items-center justify-center text-slate-400">
              <ImageOff size={28} />
              <p className="text-xs font-semibold mt-2">Chưa có hình ảnh</p>
            </div>
          )}
        </div>

        {/* Thông tin */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${card} p-5 space-y-3`}>
            {facts.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-400">{f.label}</p>
                    <p className="text-sm font-black text-slate-800">{f.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`${card} p-5`}>
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={12} /> Tiện nghi
            </p>
            {room.facilities?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {room.facilities.map((f, i) => (
                  <span key={f + i} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">
                    {f}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-400">Chưa cập nhật</p>
            )}
          </div>
        </div>
      </div>

      <div className={`${card} p-5`}>
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500 mb-2">Mô tả</p>
        <p className="text-sm text-slate-700 whitespace-pre-line">{room.description || 'Chưa có mô tả cho phòng này.'}</p>
      </div>

      {showRequest && (
        <Modal title="Gửi yêu cầu thuê phòng" subtitle={`Phòng ${room.roomNumber}`} onClose={() => setShowRequest(false)}>
          <SubmitRentalRequest
            roomId={room._id}
            onCancel={() => setShowRequest(false)}
            onSuccess={() => setShowRequest(false)}
          />
        </Modal>
      )}
      {showStatusModal && (
        <RoomStatusModal
          room={room}
          onClose={() => setShowStatusModal(false)}
          onStatusChanged={async () => {
            setShowStatusModal(false);
            try {
              const response = await roomsAPI.getRoomById(roomId);
              setRoom(response.data || null);
            } catch (error) {
              toast.error(error.response?.data?.message || 'Không tải lại được trạng thái phòng.');
            }
          }}
        />
      )}
    </div>
  );
}
