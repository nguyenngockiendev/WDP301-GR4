import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import rentalsAPI from '../api/rentals-api';
import { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';

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
      await rentalsAPI.createRentalRequest({
        ...data,
        room: roomId,
      });
      toast.success('Gửi yêu cầu thuê thành công!');
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
