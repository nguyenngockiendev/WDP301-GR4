import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export default function RoomForm({ room, onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: room || {
      roomNumber: '',
      area: '',
      price: '',
      maxTenants: 1,
      facilities: [],
      description: '',
      images: [],
    },
  });

  useEffect(() => {
    if (room) {
      reset(room);
    }
  }, [room, reset]);

  const [facilities, setFacilities] = useState(room?.facilities || []);
  const [facilityInput, setFacilityInput] = useState('');

  const handleAddFacility = () => {
    if (facilityInput.trim()) {
      setFacilities([...facilities, facilityInput]);
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (index) => {
    setFacilities(facilities.filter((_, i) => i !== index));
  };

  const onSubmitForm = (data) => {
    data.facilities = facilities;
    onSubmit(data);
  };

  return (
    <div className="room-form card p-4 shadow-sm">
      <h3 className="mb-4">{room ? 'Cập Nhật Phòng' : 'Thêm Phòng Mới'}</h3>

      <form onSubmit={handleSubmit(onSubmitForm)}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Số Phòng *</label>
            <input
              type="text"
              className="form-control"
              {...register('roomNumber', { required: 'Số phòng là bắt buộc' })}
            />
            {errors.roomNumber && <span className="text-danger">{errors.roomNumber.message}</span>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Diện Tích (m²) *</label>
            <input
              type="number"
              className="form-control"
              {...register('area', { required: 'Diện tích là bắt buộc', min: 0 })}
            />
            {errors.area && <span className="text-danger">{errors.area.message}</span>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Giá Thuê (VNĐ) *</label>
            <input
              type="number"
              className="form-control"
              {...register('price', { required: 'Giá thuê là bắt buộc', min: 0 })}
            />
            {errors.price && <span className="text-danger">{errors.price.message}</span>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Số Người Tối Đa</label>
            <input
              type="number"
              className="form-control"
              {...register('maxTenants', { min: 1 })}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Mô Tả</label>
          <textarea
            className="form-control"
            rows="3"
            {...register('description')}
          ></textarea>
        </div>

        <div className="mb-3">
          <label className="form-label">Tiện Nghi</label>
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tiện nghi..."
              value={facilityInput}
              onChange={(e) => setFacilityInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddFacility()}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleAddFacility}
            >
              Thêm
            </button>
          </div>

          <div className="facilities-list">
            {facilities.map((facility, index) => (
              <span key={index} className="badge bg-info me-2 mb-2">
                {facility}
                <button
                  type="button"
                  className="btn-close btn-close-white ms-1"
                  onClick={() => handleRemoveFacility(index)}
                ></button>
              </span>
            ))}
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            {room ? 'Cập Nhật' : 'Tạo Mới'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
