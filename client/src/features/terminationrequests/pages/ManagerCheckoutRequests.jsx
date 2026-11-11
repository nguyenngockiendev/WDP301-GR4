import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ClipboardList, RefreshCw, Search, DoorOpen, UserRound, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import terminationRequestsAPI from '../api/terminationrequests-api';
import CheckoutStatusBadge from '../components/CheckoutStatusBadge';

const unwrap = (response) => {
  const values = [response?.data?.data, response?.data, response?.data?.result];
  return values.find(Array.isArray) || [];
};
const formatDate = value => value ? new Date(value).toLocaleDateString('vi-VN') : '—';

export default function ManagerCheckoutRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [room, setRoom] = useState('');
  const [tenant, setTenant] = useState('');
  const navigate = useNavigate();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await terminationRequestsAPI.getManagerRequests({ status, room, tenant });
      setRequests(unwrap(response));
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể tải checkout request');
    } finally { setLoading(false); }
  }, [status, room, tenant]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const count = key => requests.filter(item => item.status === key).length;



  return (
    <section className="mx-auto max-w-7xl py-7">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700"><Building2 size={14}/> MANAGER WORKSPACE</div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">Quản lý yêu cầu trả phòng</h1>
          <p className="mt-2 text-sm text-slate-500">Theo dõi checkout request của các phòng thuộc Property bạn được phân công.</p>
        </div>
        <button onClick={fetchRequests} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:border-emerald-200 hover:text-emerald-700"><RefreshCw size={16}/> Làm mới</button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {[
          ['Tổng yêu cầu', requests.length, ClipboardList, 'text-emerald-600'],
          ['Chờ xử lý', count('pending'), CalendarDays, 'text-amber-500'],
          ['Đã chấp nhận', count('approved'), ClipboardList, 'text-emerald-600'],
          ['Đã từ chối', count('rejected'), ClipboardList, 'text-rose-500'],
        ].map(([label, value, Icon, color]) => <div key={label} className="rounded-3xl border border-white bg-white/85 p-5 shadow-sm"><div className="flex items-center justify-between text-sm font-semibold text-slate-500">{label}<Icon size={19} className={color}/></div><p className="mt-3 text-3xl font-black text-slate-800">{value}</p></div>)}
      </div>

      <div className="mb-5 rounded-3xl border border-white bg-white/85 p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_220px]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"><Search size={17} className="shrink-0 text-slate-400"/><input value={room} onChange={e => setRoom(e.target.value)} placeholder="Tìm theo tên phòng..." className="w-full bg-transparent text-sm outline-none"/></label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3"><UserRound size={17} className="shrink-0 text-slate-400"/><input value={tenant} onChange={e => setTenant(e.target.value)} placeholder="Tìm người đứng tên hợp đồng..." className="w-full bg-transparent text-sm outline-none"/></label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none focus:border-emerald-400">
            <option value="all">Tất cả trạng thái</option><option value="pending">Đang chờ xử lý</option><option value="approved">Đã chấp nhận</option><option value="rejected">Đã từ chối</option><option value="completed">Đã hoàn tất</option>
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-400">Danh sách được sắp xếp theo ngày gửi từ sớm nhất đến muộn nhất.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white bg-white/85 shadow-sm">
        {loading ? <div className="p-12 text-center text-sm font-semibold text-slate-500">Đang tải checkout request...</div> : !requests.length ? <div className="p-12 text-center"><ClipboardList size={32} className="mx-auto mb-3 text-slate-300"/><p className="font-bold text-slate-700">Không tìm thấy yêu cầu trả phòng</p><p className="mt-1 text-sm text-slate-400">Thử thay đổi từ khóa hoặc trạng thái lọc.</p></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Phòng</th><th className="px-5 py-4">Người đứng tên hợp đồng</th><th className="px-5 py-4">Ngày gửi</th><th className="px-5 py-4">Ngày dự kiến trả</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{requests.map(item => <tr key={item._id} className="hover:bg-emerald-50/30">
              <td className="px-5 py-4 font-extrabold text-slate-800"><span className="flex items-center gap-2"><DoorOpen size={16} className="text-emerald-600"/>{item.contract?.room?.roomNumber || '—'}</span></td>
              <td className="px-5 py-4"><div className="font-bold text-slate-700">{item.contract?.representative?.fullName || '—'}</div><div className="mt-1 text-xs text-slate-400">{item.contract?.representative?.email || ''}</div></td>
              <td className="px-5 py-4 text-slate-600">{formatDate(item.requestedDate || item.createdAt)}</td><td className="px-5 py-4 text-slate-600">{formatDate(item.moveOutDate)}</td>
              <td className="px-5 py-4"><CheckoutStatusBadge status={item.status}/></td><td className="px-5 py-4"><button onClick={() => navigate(`/manager/checkout-requests/${item._id}`)} className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-800">Quản lý checkout</button></td>
            </tr>)}</tbody>
          </table></div>
        )}
      </div>

    </section>
  );
}
