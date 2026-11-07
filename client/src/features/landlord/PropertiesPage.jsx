import { useEffect, useState } from 'react';
import { Building2, DoorOpen, Pencil, Settings2, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../shared/api/axiosClient';
import Modal, { btnGhost, btnPrimary, inputCls, labelCls } from '../../shared/components/Modal';

const cardClass =
  'rounded-3xl border border-white/90 bg-white/85 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md';
const getError = (error, fallback) => error.response?.data?.message || fallback;

function PropertyFormFields({ defaults = {} }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className={labelCls}>Tên nhà trọ</span><input name="name" required minLength="2" defaultValue={defaults.name || ''} className={inputCls} /></label>
      <label><span className={labelCls}>Địa chỉ</span><input name="address" required minLength="5" defaultValue={defaults.address || ''} className={inputCls} /></label>
      <label className="sm:col-span-2"><span className={labelCls}>Mô tả</span><textarea name="description" rows="2" defaultValue={defaults.description || ''} className={inputCls} /></label>
      {!defaults._id && (
        <>
          <div className="sm:col-span-2"><h3 className="font-extrabold text-slate-700">Đơn giá và chính sách ban đầu</h3><p className="mt-1 text-xs text-slate-500">Có thể thay đổi sau trong mục Giá và chính sách.</p></div>
          <label><span className={labelCls}>Giá điện (đ/kWh)</span><input name="electricityPrice" type="number" min="0" defaultValue="0" className={inputCls} /></label>
          <label><span className={labelCls}>Giá nước (đ/m³)</span><input name="waterPrice" type="number" min="0" defaultValue="0" className={inputCls} /></label>
          <label><span className={labelCls}>Ngày áp dụng giá điện, nước</span><input name="effectiveFrom" type="date" defaultValue={today} className={inputCls} /></label>
          <label><span className={labelCls}>Ngày đến hạn thanh toán</span><input name="paymentDueDay" type="number" min="1" max="28" defaultValue="5" className={inputCls} /></label>
          <label><span className={labelCls}>Gia hạn thanh toán (ngày)</span><input name="paymentGraceDays" type="number" min="0" max="60" defaultValue="3" className={inputCls} /></label>
          <label><span className={labelCls}>Tiền cọc (số tháng)</span><input name="depositMonths" type="number" min="0" max="12" step="0.5" defaultValue="1" className={inputCls} /></label>
          <label className="sm:col-span-2"><span className={labelCls}>Điều khoản hợp đồng mặc định</span><textarea name="policyNote" rows="3" className={inputCls} /></label>
        </>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);

  async function loadProperties() {
    try {
      const response = await api.get('/landlord/properties');
      setProperties(response.data || []);
    } catch (error) {
      toast.error(getError(error, 'Không tải được danh sách nhà trọ.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function createProperty(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setSaving(true);
    try {
      await api.post('/landlord/properties', values);
      form.reset();
      toast.success('Đã tạo nhà trọ.');
      await loadProperties();
    } catch (error) {
      toast.error(getError(error, 'Tạo nhà trọ thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  async function updateProperty(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    try {
      await api.put(`/landlord/properties/${editingProperty._id}`, values);
      toast.success('Đã cập nhật nhà trọ.');
      setEditingProperty(null);
      await loadProperties();
    } catch (error) {
      toast.error(getError(error, 'Cập nhật nhà trọ thất bại.'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(property) {
    const status = property.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/landlord/properties/${property._id}/status`, { status });
      toast.success(status === 'active' ? 'Đã kích hoạt nhà trọ.' : 'Đã tạm ngưng nhà trọ.');
      await loadProperties();
    } catch (error) {
      toast.error(getError(error, 'Không thể đổi trạng thái nhà trọ.'));
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 pt-2">
      <header>
        <h1 className="text-xl font-black tracking-tight text-slate-900">Nhà trọ của tôi</h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">Tạo và quản lý các nhà trọ thuộc quyền sở hữu của bạn.</p>
      </header>

      <form onSubmit={createProperty} className={`${cardClass} space-y-5 p-5`}>
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Building2 size={20} /></span>
          <div><h2 className="font-extrabold text-slate-800">Tạo nhà trọ</h2><p className="mt-0.5 text-xs text-slate-500">Thông tin cơ bản và đơn giá ban đầu.</p></div>
        </div>
        <PropertyFormFields />
        <button disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu…' : 'Tạo nhà trọ'}</button>
      </form>

      <section className={`${cardClass} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-800">Danh sách nhà trọ</h2>
          <span className="text-xs font-bold text-slate-400">{properties.length} nhà</span>
        </div>
        {loading ? (
          <div role="status" className="grid gap-3 md:grid-cols-2">{[1, 2].map(item => <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map(property => (
              <article key={property._id} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-800">{property.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{property.address}</p>
                    {property.description && <p className="mt-2 text-xs text-slate-500">{property.description}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-extrabold ${property.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {property.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700" to={`/properties/${property._id}/rooms`}><DoorOpen size={15} />Phòng</Link>
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100" to={`/settings?property=${property._id}`}><Settings2 size={15} />Giá và chính sách</Link>
                  <Link className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-800 hover:bg-amber-100" to={`/properties/${property._id}/operations`}><Wrench size={15} />Thiết bị & bảo trì</Link>
                  <button type="button" onClick={() => setEditingProperty(property)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"><Pencil size={14} />Sửa</button>
                  <button type="button" onClick={() => toggleStatus(property)} className={btnGhost}>{property.status === 'active' ? 'Tạm ngưng' : 'Kích hoạt'}</button>
                </div>
              </article>
            ))}
            {!properties.length && <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500 md:col-span-2">Bạn chưa tạo nhà trọ nào.</p>}
          </div>
        )}
      </section>

      {editingProperty && (
        <Modal title="Sửa thông tin nhà trọ" subtitle="Cập nhật tên, địa chỉ hoặc mô tả." onClose={() => setEditingProperty(null)}>
          <form id="edit-property-form" onSubmit={updateProperty} className="space-y-4">
            <PropertyFormFields defaults={editingProperty} />
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEditingProperty(null)} className={btnGhost}>Hủy</button>
              <button disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}
