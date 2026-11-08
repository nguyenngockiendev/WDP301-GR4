import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from './Modal';

const formValues = room => ({
  roomNumber: room?.roomNumber || '', area: room?.area ?? '', price: room?.price ?? '',
  maxTenants: room?.maxTenants ?? 1, description: room?.description || '',
});

export default function RoomForm({ room, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ defaultValues: formValues(room) });

  const [facilities, setFacilities] = useState(room?.facilities || []);
  const [imageUrls, setImageUrls] = useState((room?.images || []).join('\n'));
  const [facilityInput, setFacilityInput] = useState('');

  useEffect(() => {
    reset(formValues(room));
    setFacilities(room?.facilities || []);
    setImageUrls((room?.images || []).join('\n'));
  }, [room, reset]);

  const handleAddFacility = () => {
    const value = facilityInput.trim();
    if (value && !facilities.includes(value)) setFacilities([...facilities, value]);
    setFacilityInput('');
  };

  const onSubmitForm = data => onSubmit({
    ...formValues(data), roomNumber: data.roomNumber.trim(),
    area: Number(data.area), price: Number(data.price), maxTenants: Number(data.maxTenants), facilities,
    images: [...new Set(imageUrls.split(/\r?\n/).map(url => url.trim()).filter(Boolean))],
  });

  const err = name =>
    errors[name] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors[name].message}</p>;

  return (
    <Modal
      title={room ? `Cập nhật phòng ${room.roomNumber}` : 'Thêm phòng mới'}
      onClose={onCancel}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onCancel}>Hủy</button>
          <button type="submit" form="room-form" className={btnPrimary} disabled={isSubmitting}>
            {room ? 'Cập nhật' : 'Tạo phòng'}
          </button>
        </>
      }
    >
      <form id="room-form" onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
        <div>
          <label className={labelCls}>Đường dẫn ảnh phòng (mỗi dòng một ảnh)</label>
          <textarea rows="3" className={inputCls} value={imageUrls} onChange={e => setImageUrls(e.target.value)} placeholder="https://example.com/phong.jpg" />
          <p className="mt-1 text-xs text-slate-500">Dán URL ảnh hoặc đường dẫn ảnh có sẵn, ví dụ /images/haven-room-1.jpg. Ảnh đầu tiên dùng trên Home.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Số phòng *</label>
            <input
              className={inputCls}
              placeholder="VD: A101"
              {...register('roomNumber', { required: 'Số phòng là bắt buộc' })}
            />
            {err('roomNumber')}
          </div>
          <div>
            <label className={labelCls}>Diện tích (m²) *</label>
            <input
              type="number"
              className={inputCls}
              placeholder="25"
              {...register('area', { required: 'Diện tích là bắt buộc', min: { value: 1, message: 'Diện tích phải > 0' } })}
            />
            {err('area')}
          </div>
          <div>
            <label className={labelCls}>Giá thuê (VNĐ/tháng) *</label>
            <input
              type="number"
              className={inputCls}
              placeholder="5000000"
              {...register('price', { required: 'Giá thuê là bắt buộc', min: { value: 0, message: 'Giá không hợp lệ' } })}
            />
            {err('price')}
          </div>
          <div>
            <label className={labelCls}>Số người tối đa</label>
            <input
              type="number"
              className={inputCls}
              {...register('maxTenants', { min: { value: 1, message: 'Tối thiểu 1 người' } })}
            />
            {err('maxTenants')}
          </div>
        </div>

        <div>
          <label className={labelCls}>Mô tả</label>
          <textarea
            rows="3"
            className={`${inputCls} resize-none`}
            placeholder="Ban công, hướng Đông, gần thang máy..."
            {...register('description')}
          />
        </div>

        <div>
          <label className={labelCls}>Tiện nghi</label>
          <div className="flex gap-2">
            <input
              className={inputCls}
              placeholder="Điều hòa, máy giặt, wifi..."
              value={facilityInput}
              onChange={e => setFacilityInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddFacility();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddFacility}
              className="shrink-0 px-3.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
            >
              <Plus size={14} /> Thêm
            </button>
          </div>
          {facilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {facilities.map((f, i) => (
                <span
                  key={f + i}
                  className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] font-bold"
                >
                  {f}
                  <button
                    type="button"
                    onClick={() => setFacilities(facilities.filter((_, idx) => idx !== i))}
                    className="w-4 h-4 rounded-full hover:bg-emerald-200 flex items-center justify-center cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
