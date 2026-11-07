import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, Search, ClipboardList, Clock3, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import terminationRequestsAPI from '../api/terminationrequests-api';
import CheckoutRequestList from '../components/CheckoutRequestList';
import CheckoutRequestDetail from '../components/CheckoutRequestDetail';

const unwrapList = (response) => {
  const candidates = [response?.data?.data, response?.data, response?.data?.result, response?.data?.requests, response?.data?.data?.requests];
  return candidates.find(Array.isArray) || [];
};

export default function MyCheckoutRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await terminationRequestsAPI.getMine();
      setRequests(unwrapList(response));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return requests;
    return requests.filter((item) =>
      [item.reason, item.status, item.contract?.room?.roomNumber, item.contract?._id]
        .some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [requests, search]);

  const pendingCount = requests.filter((item) => item.status === 'pending').length;
  const completedCount = requests.filter((item) => item.status === 'completed').length;

  return (
    <section className="mx-auto max-w-7xl py-7">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700"><ClipboardList size={14} /> TENANT SERVICES</div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Yêu cầu trả phòng của tôi</h1>
          <p className="mt-2 text-sm text-slate-500">Theo dõi các yêu cầu checkout bạn đã gửi đến chủ nhà.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={fetchRequests} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"><RefreshCw size={16} /> Làm mới</button>
          <Link to="/checkout-requests/new" className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5"><Plus size={17} /> Gửi yêu cầu mới</Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Tổng yêu cầu</span><ClipboardList className="text-emerald-600" size={20} /></div><p className="mt-3 text-3xl font-black text-slate-800">{requests.length}</p></div>
        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Đang chờ xử lý</span><Clock3 className="text-amber-500" size={20} /></div><p className="mt-3 text-3xl font-black text-slate-800">{pendingCount}</p></div>
        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Đã hoàn tất</span><CheckCircle2 className="text-teal-600" size={20} /></div><p className="mt-3 text-3xl font-black text-slate-800">{completedCount}</p></div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
        <Search size={18} className="text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo phòng, mã hợp đồng, lý do..." className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
      </div>

      <CheckoutRequestList requests={filteredRequests} loading={loading} onSelect={setSelectedRequest} />
      {selectedRequest && <CheckoutRequestDetail request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
    </section>
  );
}
