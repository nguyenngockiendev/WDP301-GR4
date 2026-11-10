import { useEffect, useMemo, useState } from 'react';
import { Pencil, Settings2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../shared/api/axiosClient';
import { btnGhost, btnPrimary, inputCls, labelCls } from '../../shared/components/Modal';

const cardClass =
  'rounded-3xl border border-white/90 bg-white/85 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md';
const getError = (error, fallback) => error.response?.data?.message || fallback;
const money = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const vietnamToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

function SettingsCard({ title, description, children }) {
  return (
    <section className={cardClass}>
      <header className="mb-4">
        <h2 className="text-sm font-extrabold text-slate-800">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function ServiceForm({ service, saving, onCancel, onSubmit }) {
  return (
    <form key={service?._id || 'new-service'} onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
      <label><span className={labelCls}>Tên dịch vụ</span><input name="name" required minLength="2" defaultValue={service?.name || ''} className={inputCls} /></label>
      <label><span className={labelCls}>Đơn giá (đ)</span><input name="unitPrice" type="number" min="0" required defaultValue={service?.unitPrice ?? ''} className={inputCls} /></label>
      <label><span className={labelCls}>Cách tính phí</span>
        <select name="unitType" defaultValue={service?.unitType || 'fixed'} className={inputCls}>
          <option value="fixed">Cố định</option><option value="per_room">Theo phòng</option><option value="per_person">Theo người</option>
        </select>
      </label>
      <label><span className={labelCls}>Mô tả</span><input name="description" defaultValue={service?.description || ''} className={inputCls} /></label>
      <div className="flex justify-end gap-2 md:col-span-2">
        {service && <button type="button" onClick={onCancel} className={btnGhost}>Hủy</button>}
        <button disabled={saving} className={btnPrimary}>{saving ? 'Đang lưu…' : service ? 'Lưu dịch vụ' : 'Thêm dịch vụ'}</button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [propertyId, setPropertyId] = useState(() => searchParams.get('property') || '');
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyRoomId, setBusyRoomId] = useState('');
  const [busyServiceId, setBusyServiceId] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [estimateRoomId, setEstimateRoomId] = useState('');
  const [estimatedKwh, setEstimatedKwh] = useState(100);
  const [estimatedWater, setEstimatedWater] = useState(5);

  useEffect(() => {
    let active = true;
    api.get('/landlord/properties')
      .then(response => {
        if (!active) return;
        const list = response.data || [];
        setProperties(list);
        const preferred = list.find(item => item._id === propertyId) || list[0];
        if (!propertyId && preferred) setPropertyId(preferred._id);
      })
      .catch(error => toast.error(getError(error, 'Không tải được nhà trọ.')))
      .finally(() => active && setLoadingProperties(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!propertyId) {
      setProperty(null);
      setRooms([]);
      setServices([]);
      return undefined;
    }
    let active = true;
    setLoadingSettings(true);
    Promise.all([
      api.get('/landlord/properties'),
      api.get(`/landlord/properties/${propertyId}/rooms`),
      api.get(`/landlord/properties/${propertyId}/services`),
    ])
      .then(([propertyResponse, roomResponse, serviceResponse]) => {
        if (!active) return;
        const selected = (propertyResponse.data || []).find(item => item._id === propertyId) || null;
        const roomList = roomResponse.data || [];
        setProperty(selected);
        setRooms(roomList);
        setServices(serviceResponse.data || []);
        setEstimateRoomId(current => roomList.some(room => room._id === current) ? current : roomList[0]?._id || '');
      })
      .catch(error => toast.error(getError(error, 'Không tải được cấu hình nhà trọ.')))
      .finally(() => active && setLoadingSettings(false));
    return () => { active = false; };
  }, [propertyId, refreshKey]);

  const estimate = useMemo(() => {
    const room = rooms.find(item => item._id === estimateRoomId);
    const rent = Number(room?.price || 0);
    const electricity = Number(estimatedKwh || 0) * Number(property?.utilityRate?.electricityPrice || 0);
    const water = Number(estimatedWater || 0) * Number(property?.utilityRate?.waterPrice || 0);
    return { rent, electricity, water, total: rent + electricity + water };
  }, [rooms, estimateRoomId, estimatedKwh, estimatedWater, property]);

  async function savePropertySetting(section, event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    try {
      await api.put(`/landlord/properties/${propertyId}/${section}`, values);
      toast.success(section === 'rates' ? 'Đã lưu giá điện, nước.' : 'Đã lưu chính sách hợp đồng.');
      setRefreshKey(value => value + 1);
    } catch (error) {
      toast.error(getError(error, 'Không lưu được cấu hình.'));
    } finally {
      setSaving(false);
    }
  }

  async function saveRoomPrice(roomId, event) {
    event.preventDefault();
    const price = event.currentTarget.elements.price.value;
    setBusyRoomId(roomId);
    try {
      await api.put(`/landlord/properties/${propertyId}/rooms/${roomId}/price`, { price });
      toast.success('Đã cập nhật giá thuê phòng.');
      setRefreshKey(value => value + 1);
    } catch (error) {
      toast.error(getError(error, 'Không cập nhật được giá thuê.'));
    } finally {
      setBusyRoomId('');
    }
  }

  async function saveService(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const serviceId = editingService?._id;
    setBusyServiceId(serviceId || 'new');
    try {
      if (serviceId) {
        await api.put(`/landlord/properties/${propertyId}/services/${serviceId}`, values);
      } else {
        await api.post(`/landlord/properties/${propertyId}/services`, values);
      }
      toast.success(serviceId ? 'Đã cập nhật dịch vụ.' : 'Đã thêm dịch vụ.');
      setEditingService(null);
      setRefreshKey(value => value + 1);
    } catch (error) {
      toast.error(getError(error, 'Không lưu được dịch vụ.'));
    } finally {
      setBusyServiceId('');
    }
  }

  async function toggleService(service) {
    const status = service.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/landlord/properties/${propertyId}/services/${service._id}/status`, { status });
      toast.success(status === 'active' ? 'Đã kích hoạt dịch vụ.' : 'Đã ngừng dịch vụ.');
      setRefreshKey(value => value + 1);
    } catch (error) {
      toast.error(getError(error, 'Không cập nhật được dịch vụ.'));
    }
  }

  const formKey = `${property?._id || propertyId}-${property?.updatedAt || ''}`;
  const minRateDate = vietnamToday();

  return (
    <main className="mx-auto max-w-7xl space-y-6 pt-2">
      <header>
        <h1 className="text-xl font-black tracking-tight text-slate-900">Giá và chính sách</h1>
        <p className="mt-1 text-xs font-semibold text-slate-400">Thiết lập đơn giá và điều khoản mặc định cho từng nhà trọ.</p>
      </header>

      <label className="block max-w-xl">
        <span className={labelCls}>Nhà trọ</span>
        <select value={propertyId} onChange={event => setPropertyId(event.target.value)} disabled={loadingProperties} className={inputCls}>
          <option value="">{loadingProperties ? 'Đang tải nhà trọ…' : 'Chọn nhà trọ'}</option>
          {properties.map(item => <option key={item._id} value={item._id}>{item.name} — {item.address}</option>)}
        </select>
      </label>

      {!propertyId && !loadingProperties && <section className={cardClass}><p className="text-sm text-slate-500">Bạn cần tạo nhà trọ trước khi cấu hình giá.</p></section>}
      {propertyId && loadingSettings && <div role="status" className="space-y-3">{[1, 2, 3].map(item => <div key={item} className="h-32 animate-pulse rounded-3xl bg-white/80" />)}</div>}
      {propertyId && property && !loadingSettings && (
        <>
          <SettingsCard title="Giá thuê phòng" description="Đơn giá mới áp dụng cho hợp đồng được tạo sau khi lưu.">
            <div className="divide-y divide-slate-100">
              {rooms.map(room => (
                <form key={room._id} onSubmit={event => saveRoomPrice(room._id, event)} className="grid items-center gap-3 py-3 sm:grid-cols-[1fr_1.3fr_1fr_auto]">
                  <span className="font-bold text-slate-700">Phòng {room.roomNumber}</span>
                  <span className="text-xs text-slate-500">{room.area ? `${room.area} m² · ` : ''}{room.status}</span>
                  <label><span className="sr-only">Giá thuê phòng {room.roomNumber}</span><input name="price" type="number" min="1" max="10000000" step="1" required defaultValue={room.price} className={inputCls} /></label>
                  <button disabled={busyRoomId === room._id} className={btnPrimary}>{busyRoomId === room._id ? 'Đang lưu…' : 'Lưu giá'}</button>
                </form>
              ))}
              {!rooms.length && <p className="py-5 text-sm text-slate-500">Nhà trọ chưa có phòng. Tạo phòng trước để cấu hình giá.</p>}
            </div>
          </SettingsCard>

          <SettingsCard title="Giá điện và nước" description="Đơn giá và ngày bắt đầu áp dụng tại nhà trọ này.">
            <form key={`rates-${formKey}`} onSubmit={event => savePropertySetting('rates', event)} className="grid gap-4 md:grid-cols-3">
              <label><span className={labelCls}>Điện (đ/kWh)</span><input name="electricityPrice" type="number" min="1" max="4000" step="1" required defaultValue={property.utilityRate?.electricityPrice ?? 1} className={inputCls} /></label>
              <label><span className={labelCls}>Nước (đ/m³)</span><input name="waterPrice" type="number" min="1" step="1" required defaultValue={property.utilityRate?.waterPrice ?? 1} className={inputCls} /></label>
              <label><span className={labelCls}>Ngày áp dụng</span><input name="effectiveFrom" type="date" min={minRateDate} required defaultValue={property.utilityRate?.effectiveFrom?.slice(0, 10) || minRateDate} className={inputCls} /></label>
              <button disabled={saving} className={`${btnPrimary} md:col-span-3`}>{saving ? 'Đang lưu…' : 'Lưu đơn giá'}</button>
            </form>
          </SettingsCard>

          <SettingsCard title="Ước tính tiền phòng" description="Ước tính tiền thuê, điện và nước theo số liệu bạn nhập; chưa gồm dịch vụ.">
            <div className="grid gap-4 md:grid-cols-4">
              <label><span className={labelCls}>Phòng</span><select value={estimateRoomId} onChange={event => setEstimateRoomId(event.target.value)} className={inputCls}>
                {rooms.map(room => <option key={room._id} value={room._id}>Phòng {room.roomNumber} · {money(room.price)}</option>)}
              </select></label>
              <label><span className={labelCls}>Điện dự kiến (kWh)</span><input type="number" min="0" value={estimatedKwh} onChange={event => setEstimatedKwh(event.target.value)} className={inputCls} /></label>
              <label><span className={labelCls}>Nước dự kiến (m³)</span><input type="number" min="0" value={estimatedWater} onChange={event => setEstimatedWater(event.target.value)} className={inputCls} /></label>
              <div className="rounded-2xl bg-emerald-50 p-4"><span className="text-[10px] font-extrabold text-emerald-800">TỔNG ƯỚC TÍNH</span><strong className="mt-1 block text-xl font-black text-emerald-950">{money(estimate.total)}</strong></div>
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-3">
              <p>Tiền phòng: <strong>{money(estimate.rent)}</strong></p>
              <p>Tiền điện: <strong>{money(estimate.electricity)}</strong></p>
              <p>Tiền nước: <strong>{money(estimate.water)}</strong></p>
            </div>
          </SettingsCard>

          <SettingsCard title="Dịch vụ và phí" description="Quản lý các khoản thu định kỳ hoặc tính theo phòng/người.">
            <ServiceForm key={editingService?._id || 'new-service'} service={editingService} saving={Boolean(busyServiceId)}
              onCancel={() => setEditingService(null)} onSubmit={saveService} />
            <div className="mt-5 divide-y divide-slate-100">
              {services.map(service => (
                <article key={service._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <h3 className="font-bold text-slate-700">{service.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{money(service.unitPrice)} · {service.unitType === 'fixed' ? 'Cố định' : service.unitType === 'per_room' ? 'Theo phòng' : 'Theo người'}{service.description ? ` · ${service.description}` : ''}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${service.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{service.status === 'active' ? 'Đang áp dụng' : 'Đã ngừng'}</span>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setEditingService(service)} className={btnGhost}><Pencil size={13} className="mr-1 inline" />Sửa</button>
                    <button type="button" onClick={() => toggleService(service)} className={btnGhost}>{service.status === 'active' ? 'Ngừng' : 'Kích hoạt'}</button>
                  </div>
                </article>
              ))}
              {!services.length && <p className="py-5 text-sm text-slate-500">Chưa có dịch vụ nào.</p>}
            </div>
          </SettingsCard>

          <SettingsCard title="Chính sách hợp đồng và thanh toán" description="Áp dụng làm giá trị mặc định cho hợp đồng mới tại nhà trọ này.">
            <form key={`policy-${formKey}`} onSubmit={event => savePropertySetting('policy', event)} className="grid gap-4 md:grid-cols-3">
              <label><span className={labelCls}>Ngày đến hạn trong tháng</span><input name="paymentDueDay" type="number" min="1" max="28" required defaultValue={property.contractPolicy?.paymentDueDay ?? 5} className={inputCls} /></label>
              <label><span className={labelCls}>Gia hạn thanh toán (ngày)</span><input name="paymentGraceDays" type="number" min="0" max="60" required defaultValue={property.contractPolicy?.paymentGraceDays ?? 3} className={inputCls} /></label>
              <label><span className={labelCls}>Tiền cọc (số tháng)</span><input name="depositMonths" type="number" min="0" max="12" step="0.5" required defaultValue={property.contractPolicy?.depositMonths ?? 1} className={inputCls} /></label>
              <label className="md:col-span-3"><span className={labelCls}>Điều khoản hợp đồng</span><textarea name="policyNote" rows="4" defaultValue={property.contractPolicy?.policyNote || ''} className={inputCls} /></label>
              <button disabled={saving} className={`${btnPrimary} md:col-span-3`}><Settings2 size={14} className="mr-1 inline" />{saving ? 'Đang lưu…' : 'Lưu chính sách'}</button>
            </form>
          </SettingsCard>
        </>
      )}
    </main>
  );
}
