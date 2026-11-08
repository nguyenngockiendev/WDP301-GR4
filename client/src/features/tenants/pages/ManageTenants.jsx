import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, Users, Crown, DoorOpen, CalendarClock, X } from 'lucide-react';
import tenantsAPI from '../api/tenants-api';
import TenantList from '../components/TenantList';
import TenantItem from '../components/TenantItem';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'representative', label: 'Người đại diện' },
  { value: 'member', label: 'Người ở cùng' },
];
const DAY = 24 * 60 * 60 * 1000;

export default function ManageTenants() {
  const { propertyId } = useParams();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(query);
  useEffect(() => { setSearchTerm(query); }, [query, propertyId]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedTenant, setSelectedTenant] = useState(null);

  useEffect(() => {
    fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantsAPI.getTenantsByProperty(propertyId);
      setTenants(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách người thuê');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const rooms = new Set();
    const expiring = new Set();
    tenants.forEach(t =>
      t.contracts.forEach(c => {
        rooms.add(String(c.room?._id));
        const left = new Date(c.endDate) - Date.now();
        if (left >= 0 && left <= 30 * DAY) expiring.add(String(c.contractId));
      }),
    );
    return [
      { label: 'Tổng người thuê', value: tenants.length, icon: Users, cls: 'from-emerald-500 to-teal-400' },
      { label: 'Người đại diện', value: tenants.filter(t => t.isRepresentative).length, icon: Crown, cls: 'from-amber-500 to-orange-400' },
      { label: 'Phòng đang ở', value: rooms.size, icon: DoorOpen, cls: 'from-sky-500 to-cyan-400' },
      { label: 'HĐ sắp hết hạn', value: expiring.size, icon: CalendarClock, cls: 'from-rose-500 to-pink-400' },
    ];
  }, [tenants]);

  // Lọc ngay trên client theo tên / email / SĐT / số phòng
  const filteredTenants = useMemo(() => {
    const kw = searchTerm.trim().toLowerCase();
    return tenants.filter(t => {
      if (roleFilter === 'representative' && !t.isRepresentative) return false;
      if (roleFilter === 'member' && t.isRepresentative) return false;
      if (!kw) return true;
      return [t.fullName, t.email, t.phone, ...t.contracts.map(c => c.room?.roomNumber)]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(kw));
    });
  }, [tenants, searchTerm, roleFilter]);

  const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Quản lý khách thuê</h2>
        <p className="text-xs font-semibold text-slate-400 mt-0.5">
          Danh sách người đang ở theo hợp đồng còn hiệu lực
        </p>
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

      {/* Bảng */}
      <div className={`${card} p-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  roleFilter === f.value
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'bg-slate-100/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative md:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT hoặc số phòng..."
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100/70 animate-pulse" />)}
          </div>
        ) : (
          <TenantList tenants={filteredTenants} onSelect={setSelectedTenant} />
        )}
      </div>

      {selectedTenant && <TenantItem tenant={selectedTenant} onClose={() => setSelectedTenant(null)} />}
    </div>
  );
}
