import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import contractsAPI from '../api/contracts-api';
import { CONTRACT_STATUS } from './ContractStatusBadge';

const toInputDate = d => (d ? new Date(d).toISOString().split('T')[0] : '');

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return toInputDate(d);
};

export default function ContractForm({ contract, propertyId, onSubmit, onCancel }) {
  const isEdit = Boolean(contract);
  const today = toInputDate(new Date());

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: isEdit
      ? {
          startDate: toInputDate(contract.startDate),
          endDate: toInputDate(contract.endDate),
          monthlyRent: contract.monthlyRent,
          depositAmount: contract.depositAmount,
          status: contract.status,
        }
      : {
          rentalRequest: '',
          room: '',
          representative: '',
          startDate: today,
          endDate: addYears(today, 1),
          monthlyRent: '',
          depositAmount: '',
          status: 'active',
        },
  });

  const [options, setOptions] = useState({ rooms: [], approvedRequests: [], tenants: [] });
  const [loadingOptions, setLoadingOptions] = useState(!isEdit);

  useEffect(() => {
    if (isEdit) return;
    contractsAPI
      .getFormOptions(propertyId)
      .then(res => setOptions(res.data || { rooms: [], approvedRequests: [], tenants: [] }))
      .catch(err => toast.error(err.response?.data?.message || 'Không tải được danh sách phòng / người thuê'))
      .finally(() => setLoadingOptions(false));
  }, [isEdit, propertyId]);

  // Chọn yêu cầu thuê đã duyệt -> tự điền phòng, người đại diện, giá thuê
  const handlePickRequest = requestId => {
    setValue('rentalRequest', requestId);
    const req = options.approvedRequests.find(r => r._id === requestId);
    if (!req) return;
    setValue('room', req.room._id, { shouldValidate: true });
    setValue('representative', req.tenant._id, { shouldValidate: true });
    if (req.room.price) setValue('monthlyRent', req.room.price, { shouldValidate: true });
    if (req.expectedDate) setValue('startDate', toInputDate(req.expectedDate));
  };

  // Chọn phòng -> gợi ý giá thuê theo giá phòng
  const handlePickRoom = roomId => {
    setValue('room', roomId, { shouldValidate: true });
    const room = options.rooms.find(r => r._id === roomId);
    if (room?.price && !watch('monthlyRent')) setValue('monthlyRent', room.price, { shouldValidate: true });
  };

  const moneyLocked = isEdit && contract.status !== 'draft';

  const submit = data => {
    const payload = { ...data };
    if (!payload.rentalRequest) delete payload.rentalRequest;
    if (moneyLocked) {
      delete payload.monthlyRent;
      delete payload.depositAmount;
    }
    return onSubmit(payload);
  };

  const err = name =>
    errors[name] && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors[name].message}</p>;

  return (
    <Modal
      title={isEdit ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng mới'}
      subtitle={
        isEdit
          ? `Phòng ${contract.room?.roomNumber || ''} · ${contract.representative?.fullName || ''}`
          : 'Chọn từ yêu cầu thuê đã duyệt hoặc nhập thủ công'
      }
      onClose={onCancel}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onCancel}>Hủy</button>
          <button type="submit" form="contract-form" className={btnPrimary} disabled={isSubmitting || loadingOptions}>
            {isEdit ? 'Cập nhật' : 'Tạo hợp đồng'}
          </button>
        </>
      }
    >
      <form id="contract-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        {!isEdit && (
          <>
            {options.approvedRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <label className={labelCls}>Từ yêu cầu thuê đã duyệt</label>
                <select
                  className={inputCls}
                  value={watch('rentalRequest')}
                  onChange={e => handlePickRequest(e.target.value)}
                >
                  <option value="">— Không chọn (nhập thủ công) —</option>
                  {options.approvedRequests.map(r => (
                    <option key={r._id} value={r._id}>
                      Phòng {r.room.roomNumber} · {r.tenant.fullName} ({r.tenant.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phòng *</label>
                <select
                  className={inputCls}
                  disabled={loadingOptions}
                  {...register('room', { required: 'Vui lòng chọn phòng' })}
                  onChange={e => handlePickRoom(e.target.value)}
                >
                  <option value="">{loadingOptions ? 'Đang tải...' : '— Chọn phòng —'}</option>
                  {options.rooms.map(r => (
                    <option key={r._id} value={r._id}>
                      Phòng {r.roomNumber} · {Number(r.price || 0).toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
                {!loadingOptions && options.rooms.length === 0 && (
                  <p className="mt-1 text-[11px] font-semibold text-amber-600">Tất cả phòng đều đã có hợp đồng.</p>
                )}
                {err('room')}
              </div>

              <div>
                <label className={labelCls}>Người đại diện *</label>
                <select
                  className={inputCls}
                  disabled={loadingOptions}
                  {...register('representative', { required: 'Vui lòng chọn người đại diện' })}
                >
                  <option value="">{loadingOptions ? 'Đang tải...' : '— Chọn người thuê —'}</option>
                  {options.tenants.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.fullName} · {t.phone || t.email}
                    </option>
                  ))}
                </select>
                {err('representative')}
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ngày bắt đầu *</label>
            <input type="date" className={inputCls} {...register('startDate', { required: 'Bắt buộc' })} />
            {err('startDate')}
          </div>
          <div>
            <label className={labelCls}>Ngày kết thúc *</label>
            <input
              type="date"
              className={inputCls}
              {...register('endDate', {
                required: 'Bắt buộc',
                validate: v => !watch('startDate') || v > watch('startDate') || 'Phải sau ngày bắt đầu',
              })}
            />
            {err('endDate')}
          </div>
          <div>
            <label className={labelCls}>Tiền thuê / tháng (VNĐ) *</label>
            <input
              type="number"
              className={inputCls}
              disabled={moneyLocked}
              placeholder="5000000"
              {...register('monthlyRent', {
                required: moneyLocked ? false : 'Bắt buộc',
                min: { value: 1, message: 'Phải lớn hơn 0' },
              })}
            />
            {err('monthlyRent')}
          </div>
          <div>
            <label className={labelCls}>Tiền đặt cọc (VNĐ)</label>
            <input
              type="number"
              className={inputCls}
              disabled={moneyLocked}
              placeholder="0"
              {...register('depositAmount', { min: { value: 0, message: 'Không được âm' } })}
            />
            {err('depositAmount')}
          </div>
        </div>
        {moneyLocked && (
          <p className="text-[11px] font-semibold text-slate-400">
            Tiền thuê và tiền cọc chỉ sửa được khi hợp đồng ở trạng thái Nháp.
          </p>
        )}

        <div>
          <label className={labelCls}>Trạng thái</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CONTRACT_STATUS)
              .filter(([value]) => isEdit || value === 'active' || value === 'draft')
              .map(([value, c]) => {
                const active = watch('status') === value;
                return (
                  <label
                    key={value}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                      active
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-100'
                        : 'border-slate-200 text-slate-600 hover:border-emerald-200'
                    }`}
                  >
                    <input type="radio" value={value} className="hidden" {...register('status')} />
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {c.label}
                  </label>
                );
              })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
