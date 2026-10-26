import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import roomsAPI from '../api/rooms-api';
import RoomCard from '../components/RoomCard';

export default function BrowseRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    property: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.searchAvailableRooms(filters);
      setRooms(response.data || []);
    } catch (error) {
      toast.error('Lỗi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  return (
    <div className="browse-rooms-container p-4">
      <h2 className="mb-4">Tìm Kiếm Phòng Trọ</h2>

      <div className="filter-section card p-3 mb-4">
        <form onSubmit={handleSearch}>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Giá Tối Thiểu (VNĐ)</label>
              <input
                type="number"
                className="form-control"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
              />
            </div>

            <div className="col-md-4 mb-3">
              <label className="form-label">Giá Tối Đa (VNĐ)</label>
              <input
                type="number"
                className="form-control"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="10000000"
              />
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <button type="submit" className="btn btn-primary w-100">
                Tìm Kiếm
              </button>
            </div>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="alert alert-info">Không tìm thấy phòng nào khả dụng</div>
      ) : (
        <div className="row">
          {rooms.map((room) => (
            <div key={room._id} className="col-md-4 mb-4">
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
