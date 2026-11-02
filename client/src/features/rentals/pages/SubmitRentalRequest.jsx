import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import rentalsAPI from '../api/rentals-api';

export default function SubmitRentalRequest({ roomId, onSuccess }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await rentalsAPI.createRentalRequest({
        ...data,
        room: roomId,
      });
      toast.success('Gửi yêu cầu thuê thành công!');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gửi yêu cầu thuê');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-rental-container p-4">
      <div className="card shadow-sm max-w-500">
        <div className="card-body">
          <h3 className="card-title mb-4">Gửi Yêu Cầu Thuê Phòng</h3>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-3">
              <label className="form-label">Ngày Dự Kiến Nhận Phòng *</label>
              <input
                type="date"
                className="form-control"
                {...register('expectedDate', { required: 'Vui lòng chọn ngày' })}
              />
              {errors.expectedDate && (
                <span className="text-danger text-sm">{errors.expectedDate.message}</span>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Ghi Chú</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Ghi chú thêm (không bắt buộc)"
                {...register('note')}
              ></textarea>
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate(-1)}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
