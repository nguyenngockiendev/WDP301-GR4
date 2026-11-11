import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../../shared/api/axiosClient';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from './Modal';

const formValues = room => ({
  roomNumber: room?.roomNumber || '', area: room?.area ?? '', price: room?.price ?? '',
  maxTenants: room?.maxTenants ?? 1, floor: room?.floor ?? 1, description: room?.description || '',
});

export default function RoomForm({ room, propertyId, totalFloors = 1, onSubmit, onCancel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ defaultValues: formValues(room) });

  const [facilities, setFacilities] = useState(room?.facilities || []);
  const [imageUrls, setImageUrls] = useState((room?.images || []).join('\n'));
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState(false);
  const [assetIds, setAssetIds] = useState([]);

  useEffect(() => {
    let active = true;
    setAssetsLoading(true);
    setAssetsError(false);
    api.get(`/operations/properties/${propertyId}/assets`)
      .then(response => { if (active) setAssets(response.data || []); })
      .catch(() => { if (active) { setAssets([]); setAssetsError(true); } })
      .finally(() => { if (active) setAssetsLoading(false); });
    return () => { active = false; };
  }, [propertyId]);

  useEffect(() => {
    reset(formValues(room));
    setFacilities(room?.facilities || []);
    setImageUrls((room?.images || []).join('\n'));
    setAssetIds([]);
  }, [room, reset]);

  useEffect(() => {
    if (!assetsLoading) {
      const assigned = assets.filter(asset => String(asset.room?._id || asset.room || '') === String(room?._id || ''));
      setAssetIds(assigned.map(asset => asset._id));
      if (assigned.length) {
        const assignedNames = new Set(assigned.map(asset => asset.name));
        setFacilities(current => current.filter(name => !assignedNames.has(name)));
      }
    }
  }, [assets, assetsLoading, room]);

  const selectableAssets = assets.filter(asset =>
    asset.status !== 'retired' && (!asset.room || String(asset.room?._id || asset.room) === String(room?._id || '')),
  );

  const onSubmitForm = data => onSubmit({
    ...formValues(data), roomNumber: data.roomNumber.trim(),
    area: Number(data.area), price: Number(data.price), maxTenants: Number(data.maxTenants), floor: Number(data.floor),
    facilities: [...new Set([...facilities, ...assets.filter(asset => assetIds.includes(asset._id)).map(asset => asset.name)])],
    assetIds,
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
          <button type="submit" form="room-form" className={btnPrimary} disabled={isSubmitting || assetsLoading || assetsError}>
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
              type="text"
              autoComplete="off"
              maxLength={30}
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
              min="1"
              max="10000000"
              step="1"
              className={inputCls}
              placeholder="5000000"
              {...register('price', { required: 'Giá thuê là bắt buộc', min: { value: 1, message: 'Giá thuê phải lớn hơn 0' }, max: { value: 10000000, message: 'Giá thuê tối đa 10.000.000 đồng/tháng' } })}
            />
            {err('price')}
          </div>
          <div>
            <label className={labelCls}>Số người tối đa (1–4)</label>
            <input
              type="number"
              className={inputCls}
              min="1"
              max="4"
              {...register('maxTenants', { required: 'Hãy nhập số người tối đa', min: { value: 1, message: 'Tối thiểu 1 người' }, max: { value: 4, message: 'Tối đa 4 người mỗi phòng' }, valueAsNumber: true })}
            />
            {err('maxTenants')}
          </div>
          <div>
            <label className={labelCls}>Tầng (tòa có {totalFloors} tầng)</label>
            <input
              type="number"
              min="1"
              max={totalFloors}
              step="1"
              className={inputCls}
              {...register('floor', { required: 'Hãy chọn tầng', valueAsNumber: true, min: { value: 1, message: 'Tầng phải từ 1 trở lên' }, max: { value: totalFloors, message: `Tòa này chỉ có ${totalFloors} tầng` } })}
            />
            {err('floor')}
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
          <label className={labelCls}>Tiện nghi trong phòng (thiết bị)</label>
          <div className="mt-4">
            <p className="mb-2 text-xs text-slate-500">Chọn tài sản đã tạo ở mục Thiết bị &amp; bảo trì. Đây cũng là danh sách tiện nghi của phòng.</p>
            {assetsLoading ? <p className="text-xs text-slate-500">Đang tải danh mục thiết bị…</p> : assetsError ? <p className="text-xs text-rose-600">Không tải được danh mục thiết bị nên chưa thể lưu để tránh làm mất liên kết hiện có.</p> : selectableAssets.length ? (
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
                {selectableAssets.map(asset => (
                  <label key={asset._id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-emerald-50">
                    <input type="checkbox" checked={assetIds.includes(asset._id)} onChange={event => setAssetIds(current => event.target.checked ? [...current, asset._id] : current.filter(id => id !== asset._id))} />
                    <span className="font-semibold">{asset.name}</span>
                    <span className="text-slate-400">{asset.assetCode ? `· ${asset.assetCode}` : `· ${asset.category}`}</span>
                  </label>
                ))}
              </div>
            ) : <p className="text-xs text-slate-500">Chưa có thiết bị trong kho để gán. Hãy thêm thiết bị ở mục Thiết bị &amp; bảo trì.</p>}
          </div>
          {facilities.length > 0 && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-bold text-slate-500">Tiện nghi đã nhập trước đây (giữ nguyên)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {facilities.map((facility, index) => <span key={`${facility}-${index}`} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">{facility}</span>)}
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
