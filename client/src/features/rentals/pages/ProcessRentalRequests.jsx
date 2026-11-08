import { getCurrentUser } from '../../../shared/utils/auth';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, CalendarClock, Hourglass, CheckCircle2, XCircle } from 'lucide-react';
import rentalsAPI from '../api/rentals-api';
import RentalRequestList from '../components/RentalRequestList';
import { RENTAL_STATUS } from '../components/RentalStatusBadge';

export default function ProcessRentalRequests() {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const readOnly = getCurrentUser()?.role !== 'manager';
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await rentalsAPI.getRentalRequestsByProperty(propertyId);
      setRequests(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  /** Trả về true nếu xử lý thành công (để đóng popup). */
  const handleProcessRequest = async (requestId, status, rejectReason) => {
    try {
      const data = { status };
      if (status === 'rejected') data.rejectReason = rejectReason;
      await rentalsAPI.processRentalRequest(requestId, data);
      toast.success(status === 'approved' ? 'Đã phê duyệt yêu cầu' : 'Đã từ chối yêu cầu');
      fetchRequests();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi xử lý yêu cầu');
      return false;
    }
  };

  // Yêu cầu đã duyệt -> sang trang hợp đồng, form tạo có sẵn mục "Từ yêu cầu thuê đã duyệt"
  const handleCreateContract = request => navigate(`/properties/${propertyId}/contracts?create=1&request=${request._id}`);

  const counts = useMemo(() => {
    const c = { all: requests.length };
    Object.keys(RENTAL_STATUS).forEach(s => (c[s] = requests.filter(r => r.status === s).length));
    return c;
  }, [requests]);

  const stats = [
    { label: 'Tổng yêu cầu', value: counts.all, icon: CalendarClock, cls: 'from-emerald-500 to-teal-400' },
    { label: 'Chờ xử lý', value: counts.pending, icon: Hourglass, cls: 'from-amber-500 to-orange-400' },
    { label: 'Đã duyệt', value: counts.approved, icon: CheckCircle2, cls: 'from-green-500 to-emerald-400' },
    { label: 'Từ chối', value: counts.rejected, icon: XCircle, cls: 'from-rose-500 to-pink-400' },
  ];

  const filters = [
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'all', label: 'Tất cả' },
  ];

  const filteredRequests = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return requests.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!kw) return true;
      return [r.tenant?.fullName, r.tenant?.email, r.tenant?.phone, r.room?.roomNumber]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(kw));
    });
  }, [requests, filter, keyword]);

  const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Yêu cầu đặt phòng</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">{readOnly ? 'Theo dõi yêu cầu thuê phòng. Quản lý được phân công sẽ xử lý yêu cầu.' : 'Duyệt hoặc từ chối yêu cầu thuê phòng của khách'}</p>
      </div>

      {/* Thẻ thống kê */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${card} p-4 flex items-center gap-3.5`}>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${s.cls} text-white flex items-center justify-center shadow-md shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-slate-400 truncate">{s.label}</p>
                <p className="text-xl font-black text-slate-900 leading-tight">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bộ lọc */}
      <div className={`${card} p-4 flex flex-col md:flex-row md:items-center justify-between gap-3`}>
        <div className="flex flex-wrap gap-1.5">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                filter === f.value
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                  : 'bg-slate-100/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {f.label}
              <span
                className={`px-1.5 rounded-full text-[10px] ${
                  filter === f.value ? 'bg-white/25 text-white' : 'bg-white text-slate-500'
                }`}
              >
                {counts[f.value] || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm tên, SĐT khách hoặc số phòng..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Danh sách */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-72 rounded-3xl bg-white/70 animate-pulse" />)}
        </div>
      ) : (
        <RentalRequestList
          readOnly={readOnly}
          requests={filteredRequests}
          onProcess={handleProcessRequest}
          onCreateContract={handleCreateContract}
        />
      )}
    </div>
  );
}
