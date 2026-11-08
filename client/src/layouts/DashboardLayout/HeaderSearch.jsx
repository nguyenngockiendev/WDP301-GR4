import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../shared/api/axiosClient';

export default function HeaderSearch({ propertyId }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState({ rooms: [], tenants: [], loading: false, error: '' });
  const root = useRef(null);
  const location = useLocation();
  useEffect(() => { setQuery(''); setOpen(false); }, [propertyId, location.pathname, location.search]);
  useEffect(() => {
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    if (!query.trim() || !propertyId) return;
    setResult({ rooms: [], tenants: [], loading: true, error: '' });
    const timer = setTimeout(async () => {
      try {
        const [rooms, tenants] = await Promise.all([
          api.get('/rooms/property/' + propertyId, { signal: controller.signal }),
          api.get('/tenants/property/' + propertyId, { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        const keyword = normalize(query.trim());
        const matches = values => values.some(value => normalize(value).includes(keyword));
        setResult({
          rooms: (rooms.data || []).filter(r => matches([r.roomNumber, r.name])).slice(0, 5),
          tenants: (tenants.data || []).filter(t => matches([t.fullName, t.email, t.phone, ...(t.contracts || []).map(c => c.room?.roomNumber)])).slice(0, 5),
          loading: false, error: '',
        });
      } catch {
        if (!controller.signal.aborted) setResult({ rooms: [], tenants: [], loading: false, error: 'Không tải được kết quả. Hãy thử lại.' });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, propertyId]);

  return <div ref={root} className="relative">
    <Search size={15} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
    <input type="search" aria-label="Tìm kiếm phòng, khách thuê" autoComplete="off"
      value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
      onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }} disabled={!propertyId}
      placeholder={propertyId ? 'Tìm kiếm phòng, khách thuê...' : 'Chọn tòa nhà để tìm kiếm'}
      className="w-64 pl-10 pr-4 py-2.5 rounded-2xl text-xs bg-white/80 border border-emerald-100/80 outline-none text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" />
    {open && query.trim() && propertyId && <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-emerald-100 shadow-xl p-3" aria-live="polite">
      <p className="text-xs font-bold text-slate-500 mb-2">Kết quả trong tòa nhà đang chọn</p>
      {result.loading ? <p role="status" className="text-xs p-2">Đang tìm...</p> : result.error ? <p role="alert" className="text-xs text-red-600 p-2">{result.error}</p> : <>
        {!result.rooms.length && !result.tenants.length && <p className="text-xs p-2">Không tìm thấy phòng hoặc khách thuê.</p>}
        {result.rooms.map(room => <Link key={room._id} className="block rounded-xl p-2 hover:bg-emerald-50 text-xs" to={'/properties/' + propertyId + '/rooms?q=' + encodeURIComponent(room.roomNumber)}>
          <span className="font-bold">Phòng {room.roomNumber}</span><span className="block text-slate-500">{Number(room.price || 0).toLocaleString('vi-VN')} đ/tháng</span>
        </Link>)}
        {result.tenants.map(tenant => <Link key={tenant._id} className="block rounded-xl p-2 hover:bg-emerald-50 text-xs" to={'/properties/' + propertyId + '/tenants?q=' + encodeURIComponent(tenant.email || tenant.fullName)}>
          <span className="font-bold">Khách thuê: {tenant.fullName}</span><span className="block text-slate-500">{tenant.phone || tenant.email}</span>
        </Link>)}
      </>}
    </div>}
  </div>;
}
