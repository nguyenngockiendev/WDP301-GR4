import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, Search, FileSignature, FileCheck2, CalendarClock, FileX2 } from 'lucide-react';
import contractsAPI from '../api/contracts-api';
import ContractList from '../components/ContractList';
import ContractForm from '../components/ContractForm';
import { CONTRACT_STATUS } from '../components/ContractStatusBadge';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  ...Object.entries(CONTRACT_STATUS).map(([value, c]) => ({ value, label: c.label })),
];
const DAY = 24 * 60 * 60 * 1000;

export default function ManageContracts() {
  const { propertyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    setInitialRequestId(searchParams.get('request') || '');
    setSelectedContract(null);
    setShowForm(true);
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    next.delete('request');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const [initialRequestId, setInitialRequestId] = useState('');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await contractsAPI.getContractsByProperty(propertyId);
      setContracts(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi tải danh sách hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const now = Date.now();
    const active = contracts.filter(c => c.status === 'active');
    const expiringSoon = active.filter(c => {
      const left = new Date(c.endDate) - now;
      return left >= 0 && left <= 30 * DAY;
    }).length;
    return [
      { label: 'Tổng hợp đồng', value: contracts.length, icon: FileSignature, cls: 'from-emerald-500 to-teal-400' },
      { label: 'Đang hiệu lực', value: active.length, icon: FileCheck2, cls: 'from-green-500 to-emerald-400' },
      { label: 'Sắp hết hạn (30 ngày)', value: expiringSoon, icon: CalendarClock, cls: 'from-amber-500 to-orange-400' },
      {
        label: 'Hết hạn / Kết thúc',
        value: contracts.filter(c => c.status === 'expired' || c.status === 'terminated').length,
        icon: FileX2,
        cls: 'from-rose-500 to-pink-400',
      },
    ];
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return contracts.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!kw) return true;
      return [c.room?.roomNumber, c.representative?.fullName, c.representative?.phone, c.representative?.email]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(kw));
    });
  }, [contracts, keyword, statusFilter]);

  const openForm = (contract = null) => {
    setInitialRequestId('');
    setSelectedContract(contract);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedContract(null);
  };

  const handleSaveContract = async formData => {
    try {
      if (selectedContract) {
        await contractsAPI.updateContract(selectedContract._id, formData);
        toast.success('Cập nhật hợp đồng thành công');
      } else {
        await contractsAPI.createContract(formData);
        toast.success('Tạo hợp đồng thành công');
      }
      fetchContracts();
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu hợp đồng');
    }
  };

  const card = 'rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)]';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">
      {/* Tiêu đề */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Quản lý hợp đồng</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Tạo, gia hạn và theo dõi hợp đồng thuê của từng phòng
          </p>
        </div>
        <button
          onClick={() => openForm()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition cursor-pointer self-start"
        >
          <Plus size={16} className="stroke-[2.5]" />
          Tạo hợp đồng
        </button>
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
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                  : 'bg-slate-100/80 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Tìm số phòng, tên, SĐT người thuê..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-medium focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Danh sách */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-white/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <ContractList contracts={filteredContracts} onEdit={openForm} onRefresh={fetchContracts} />
      )}

      {showForm && (
        <ContractForm
          contract={selectedContract}
          propertyId={propertyId}
          initialRequestId={initialRequestId}
          onSubmit={handleSaveContract}
          onCancel={handleCloseForm}
        />
      )}
    </div>
  );
}
