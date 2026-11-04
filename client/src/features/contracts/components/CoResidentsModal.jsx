import { useEffect, useMemo, useState } from 'react';
import { Search, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';
import contractsAPI from '../api/contracts-api';

export default function CoResidentsModal({ contract, onClose, onSaved }) {
  const [occupants, setOccupants] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [busy, setBusy] = useState(false);

  async function loadOccupants() {
    try {
      const response = await contractsAPI.getOccupants(contract._id);
      const data = response.data;
      setOccupants(data);
      setSelected((data.otherMembers || []).map(member => String(member._id)));
    } catch (error) { toast.error(error.response?.data?.message || 'Không tải được danh sách người trong phòng.'); }
  }
  async function loadCandidates(nextPage = page, term = search) {
    try {
      const response = await contractsAPI.getCoResidentCandidates(contract._id, { page: nextPage, pageSize: 10, search: term });
      const data = response.data;
      setCandidates(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) { toast.error(error.response?.data?.message || 'Không tải được danh sách người thuê.'); }
  }
  useEffect(() => { loadOccupants(); loadCandidates(1, ''); }, [contract._id]);

  const currentMembers = useMemo(() => new Map((occupants?.otherMembers || []).map(member => [String(member._id), member])), [occupants]);
  const selectedCount = 1 + selected.length;
  const toggle = id => setSelected(value => value.includes(id) ? value.filter(item => item !== id) : [...value, id]);

  async function save() {
    setBusy(true);
    try {
      await contractsAPI.setCoResidents(contract._id, selected);
      toast.success('Đã cập nhật danh sách người ở cùng.');
      onSaved();
      onClose();
    } catch (error) { toast.error(error.response?.data?.message || 'Không thể cập nhật người ở cùng.'); }
    finally { setBusy(false); }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="co-residents-title">
      <header className="flex items-start justify-between border-b border-emerald-50 px-6 py-5">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700"><Users size={15}/> Thành viên phòng {occupants?.room?.roomNumber || ''}</div><h2 id="co-residents-title" className="text-xl font-black text-slate-800">Quản lý người ở cùng</h2><p className="mt-1 text-sm text-slate-500">Người đại diện vẫn là đầu mối hợp đồng và thanh toán.</p></div>
        <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} aria-label="Đóng"><X size={19}/></button>
      </header>
      <div className="max-h-[65vh] space-y-5 overflow-y-auto px-6 py-5">
        {!occupants ? <p className="py-8 text-center text-sm text-slate-500">Đang tải thông tin phòng…</p> : <>
          <div className="rounded-2xl bg-emerald-50/70 p-4"><div className="flex items-center justify-between text-xs font-bold text-emerald-950"><span>Sức chứa phòng</span><span>{selectedCount} / {occupants.capacity} người</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all" style={{ width: `${Math.min(100, selectedCount / occupants.capacity * 100)}%` }}/></div><p className="mt-2 text-[11px] text-emerald-800">Người đại diện: <strong>{occupants.representative?.fullName}</strong></p></div>
          <div><h3 className="mb-2 text-sm font-bold text-slate-700">Người đang ở cùng</h3>{selected.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-slate-500">Chưa có người ở cùng trong hợp đồng.</p> : <div className="space-y-2">{selected.map(id => { const member = currentMembers.get(id) || candidates.find(item => String(item._id) === id); return <div key={id} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white px-3 py-2.5"><div><p className="text-sm font-bold text-slate-700">{member?.fullName || 'Người thuê'}</p><p className="text-xs text-slate-500">{member?.email || ''}{member?.phone ? ` · ${member.phone}` : ''}</p></div><button className="rounded-lg px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => toggle(id)}>Xóa khỏi phòng</button></div>; })}</div>}</div>
          <div><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-700">Thêm người thuê vào phòng</h3><span className="text-xs text-slate-400">Chỉ hiện tài khoản chưa có phòng</span></div><form className="mb-3 flex gap-2" onSubmit={event => { event.preventDefault(); setPage(1); loadCandidates(1, search); }}><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên, email hoặc số điện thoại" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"/></div><button className="rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 hover:bg-slate-200">Tìm</button></form>
            {candidates.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Không có người thuê phù hợp.</p> : <div className="space-y-2">{candidates.map(person => { const id = String(person._id); const checked = selected.includes(id); const full = selectedCount >= occupants.capacity && !checked; return <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-100 hover:border-emerald-200'} ${full ? 'cursor-not-allowed opacity-50' : ''}`}><input type="checkbox" checked={checked} disabled={full} onChange={() => toggle(id)} className="h-4 w-4 accent-emerald-600"/><span><strong className="block text-sm text-slate-700">{person.fullName}</strong><small className="text-xs text-slate-500">{person.email}{person.phone ? ` · ${person.phone}` : ''}</small></span></label>; })}</div>}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Trang {page} / {totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => { const next = page - 1; setPage(next); loadCandidates(next); }} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button><button disabled={page >= totalPages} onClick={() => { const next = page + 1; setPage(next); loadCandidates(next); }} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button></div></div>
          </div>
        </>}
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4"><button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600">Hủy</button><button disabled={busy || !occupants} onClick={save} className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50">{busy ? 'Đang lưu…' : 'Lưu danh sách'}</button></footer>
    </section>
  </div>;
}
