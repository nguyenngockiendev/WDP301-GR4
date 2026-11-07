import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, RotateCcw, SearchX } from 'lucide-react';
import roomsAPI from '../api/rooms-api';
import RoomCard from '../components/RoomCard';
import { inputCls, labelCls } from '../../../shared/components/Modal';

const EMPTY_FILTERS = { property: '', minPrice: '', maxPrice: '' };

export default function BrowseRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    property: '',
    minPrice: '',
    maxPrice: '',
    tier: '',
  });

  useEffect(() => {
    fetchRooms(EMPTY_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = async (f = filters) => {
    if (f.minPrice && f.maxPrice && Number(f.minPrice) > Number(f.maxPrice)) {
      toast.error('Giá tối thiểu phải nhỏ hơn giá tối đa');
      return;
    }
    try {
      setLoading(true);
      // Chỉ gửi các bộ lọc có giá trị
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
      const response = await roomsAPI.searchAvailableRooms(params);
      setRooms(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchRooms();
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    fetchRooms(EMPTY_FILTERS);
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };
  const visibleRooms = filters.tier
    ? rooms.filter(room => (room.tier || 'standard') === filters.tier)
    : rooms;

  const card =
    'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

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
              <label className="form-label">Hạng phòng</label>
              <select
                className="form-select"
                name="tier"
                value={filters.tier}
                onChange={handleFilterChange}
              >
                <option value="">Tất cả hạng</option>
                <option value="basic">Cơ bản</option>
                <option value="standard">Tiêu chuẩn</option>
                <option value="premium">Cao cấp</option>
              </select>
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
      <form
        onSubmit={handleSearch}
        className={`${card} p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end`}
      >
        <div>
          <label className={labelCls}>Giá tối thiểu (VNĐ)</label>
          <input
            type="number"
            min="0"
            className={inputCls}
            name="minPrice"
            value={filters.minPrice}
            onChange={handleFilterChange}
            placeholder="0"
          />
        </div>
      </form>
      rooms.length === 0 ? (
      <div className={`${card} p-10 flex flex-col items-center text-slate-400`}>
        <SearchX size={28} />
        <p className="text-sm font-semibold mt-2">Không tìm thấy phòng nào khả dụng</p>
      </div>
      ) : (
      <>
        <p className="text-xs font-bold text-slate-500">Tìm thấy {rooms.length} phòng</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map(room => (
            <RoomCard key={room._id} room={room} />
          ))}
        </div>
      </>
      )
    </div>
  );
}
