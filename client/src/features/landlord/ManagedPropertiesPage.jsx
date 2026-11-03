import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, DoorOpen, FileSignature, CalendarClock } from 'lucide-react';
import api from '../../shared/api/axiosClient';

export default function ManagedPropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/manager/properties')
      .then(response => setProperties(response.data || []))
      .catch(e => setError(e.response?.data?.message || 'Không tải được nhà trọ được phân công.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-black text-slate-800">Nhà trọ được phân công</h1>
        <p className="text-sm text-slate-500">Bạn chỉ có thể thao tác nghiệp vụ trong các nhà trọ được Chủ trọ giao.</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {loading && <p role="status" className="text-sm text-slate-500">Đang tải nhà trọ…</p>}
      {!loading && !error && !properties.length && (
        <section className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
          Chủ trọ chưa phân công nhà trọ cho tài khoản của bạn.
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-2">
        {properties.map(property => (
          <article key={property._id} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Building2 size={20} /></span>
              <div>
                <h2 className="font-bold text-slate-800">{property.name}</h2>
                <p className="text-sm text-slate-500">{property.address}</p>
              </div>
            </div>
            {property.description && <p className="text-sm text-slate-600">{property.description}</p>}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Link to={`/properties/${property._id}/rooms`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><DoorOpen size={16} />Quản lý phòng</Link>
              <Link to={`/properties/${property._id}/rental-requests`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700"><CalendarClock size={16} />Yêu cầu thuê</Link>
              <Link to={`/properties/${property._id}/contracts`} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700"><FileSignature size={16} />Hợp đồng</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
