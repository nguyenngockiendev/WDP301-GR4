import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function ContractForm({ contract, propertyId, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: contract || {
      room: '',
      representative: '',
      startDate: '',
      endDate: '',
      monthlyRent: '',
      depositAmount: 0,
      status: 'draft',
    },
  });

  const [otherMembers, setOtherMembers] = useState(contract?.otherMembers || []);
  const [memberInput, setMemberInput] = useState('');

  useEffect(() => {
    if (contract) {
      reset(contract);
    }
  }, [contract, reset]);

  const onSubmitForm = (data) => {
    data.otherMembers = otherMembers;
    onSubmit(data);
  };

  return (
    <div className="contract-form card p-4 shadow-sm">
      <h3 className="mb-4">{contract ? 'Cập Nhật Hợp Đồng' : 'Tạo Hợp Đồng Mới'}</h3>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Phòng *</label>
            <input
              type="text"
              className="form-control"
              placeholder="ID Phòng"
              {...register('room', { required: 'Phòng là bắt buộc' })}
            />
            {errors.room && <span className="text-danger">{errors.room.message}</span>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Người Đại Diện *</label>
            <input
              type="text"
              className="form-control"
              placeholder="ID Người Thuê"
              {...register('representative', { required: 'Người đại diện là bắt buộc' })}
            />
            {errors.representative && (
              <span className="text-danger">{errors.representative.message}</span>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Ngày Bắt Đầu *</label>
            <input
              type="date"
              className="form-control"
              {...register('startDate', { required: 'Ngày bắt đầu là bắt buộc' })}
            />
            {errors.startDate && <span className="text-danger">{errors.startDate.message}</span>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Ngày Kết Thúc *</label>
            <input
              type="date"
              className="form-control"
              {...register('endDate', { required: 'Ngày kết thúc là bắt buộc' })}
            />
            {errors.endDate && <span className="text-danger">{errors.endDate.message}</span>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Tiền Thuê Hàng Tháng (VNĐ) *</label>
            <input
              type="number"
              className="form-control"
              {...register('monthlyRent', { required: 'Tiền thuê là bắt buộc', min: 0 })}
            />
            {errors.monthlyRent && (
              <span className="text-danger">{errors.monthlyRent.message}</span>
            )}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Tiền Đặt Cọc (VNĐ)</label>
            <input
              type="number"
              className="form-control"
              {...register('depositAmount', { min: 0 })}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Trạng Thái</label>
          <select className="form-select" {...register('status')}>
            <option value="draft">Nháp</option>
            <option value="active">Hoạt Động</option>
            <option value="expired">Hết Hạn</option>
            <option value="terminated">Kết Thúc</option>
          </select>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            {contract ? 'Cập Nhật' : 'Tạo Mới'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
