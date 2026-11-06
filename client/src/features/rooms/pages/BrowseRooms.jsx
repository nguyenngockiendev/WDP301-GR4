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
  const [filters, setFilters] = useState(EMPTY_FILTERS);

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

  const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Tìm kiếm phòng trống</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">Lọc phòng đang trống theo khoảng giá thuê</p>
      </div>

      <form onSubmit={handleSearch} className={`${card} p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end`}>
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
        <div>
          <label className={labelCls}>Giá tối đa (VNĐ)</label>
          <input
            type="number"
            min="0"
            className={inputCls}
            name="maxPrice"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            placeholder="10000000"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Search size={14} /> Tìm kiếm
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
        >
          <RotateCcw size={14} /> Đặt lại
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 rounded-3xl bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
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
      )}
    </div>
  );
}
