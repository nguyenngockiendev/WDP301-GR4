import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import rentalsAPI from '../api/rentals-api';
import { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';
import { getCurrentUser } from '../../../shared/utils/auth';

const toInputDate = d => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().split('T')[0];
};

/**
 * Form người thuê gửi yêu cầu thuê phòng.
 * Dùng được trong popup (truyền roomId/onSuccess/onCancel) hoặc làm trang /rooms/:roomId/rental-request.
 */
export default function SubmitRentalRequest({ roomId: roomIdProp, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const params = useParams();
  const roomId = roomIdProp || params.roomId;
  const isGuest = !getCurrentUser();
  const today = toInputDate(new Date());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { expectedDate: today, note: '' } });
  const [loading, setLoading] = useState(false);

  const onSubmit = async data => {
    try {
      setLoading(true);
      const requestData = { ...data, room: roomId };
      if (isGuest) await rentalsAPI.createGuestRentalRequest(requestData);
      else await rentalsAPI.createRentalRequest(requestData);
      toast.success(isGuest ? 'Đã gửi yêu cầu. Quản lý sẽ liên hệ với bạn.' : 'Gửi yêu cầu thuê thành công!');
      if (onSuccess) onSuccess();
      else navigate(`/rooms/${roomId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gửi yêu cầu thuê');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => (onCancel ? onCancel() : navigate(-1));

  const form = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isGuest && (
        <>
          <div>
            <label className={labelCls}>Họ và tên *</label>
            <input className={inputCls} placeholder="Nguyễn Văn A" {...register('fullName', { required: 'Vui lòng nhập họ tên', minLength: { value: 2, message: 'Họ tên tối thiểu 2 ký tự' } })} />
            {errors.fullName && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.fullName.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" className={inputCls} placeholder="email@example.com" {...register('email', { required: 'Vui lòng nhập email', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' } })} />
            {errors.email && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.email.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Số điện thoại *</label>
            <input type="tel" className={inputCls} placeholder="09xxxxxxxx" {...register('phone', { required: 'Vui lòng nhập số điện thoại', pattern: { value: /^[0-9+().\-\s]{8,20}$/, message: 'Số điện thoại không hợp lệ' } })} />
            {errors.phone && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.phone.message}</p>}
          </div>
          <p className="text-xs text-slate-500">Chưa cần tạo tài khoản. Nếu yêu cầu được duyệt, quản lý sẽ tạo tài khoản thuê cho bạn.</p>
        </>
      )}
      <div>
        <label className={labelCls}>Ngày dự kiến nhận phòng *</label>
        <input
          type="date"
          min={today}
          className={inputCls}
          {...register('expectedDate', {
            required: 'Vui lòng chọn ngày',
            validate: v => v >= today || 'Ngày dự kiến không được trong quá khứ',
          })}
        />
        {errors.expectedDate && (
          <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.expectedDate.message}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>Ghi chú</label>
        <textarea
          className={inputCls}
          rows="3"
          placeholder="Ghi chú thêm (không bắt buộc)"
          {...register('note', { maxLength: { value: 500, message: 'Tối đa 500 ký tự' } })}
        />
        {errors.note && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.note.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className={btnGhost} onClick={handleCancel} disabled={loading}>
          Hủy
        </button>
        <button type="submit" className={btnPrimary} disabled={loading || !roomId}>
          {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
      </div>
    </form>
  );

  // Trong popup thì chỉ render form
  if (roomIdProp) return form;

  return (
    <div className="max-w-lg mx-auto pt-2">
      <div className="rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6">
        <h2 className="text-lg font-black text-slate-900 tracking-tight mb-4">Gửi yêu cầu thuê phòng</h2>
        {form}
      </div>
    </div>
  );
}
