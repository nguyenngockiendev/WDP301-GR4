import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Building2, CalendarDays, ClipboardCheck,
  ImagePlus, LoaderCircle, Save, X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import terminationRequestsAPI from '../api/terminationrequests-api';
import CheckoutStatusBadge from '../components/CheckoutStatusBadge';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
const dateText = value => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
};
const allowedStatuses = ['in_use', 'maintenance', 'retired'];

function getUsage(value) {
  if (value === '') return null;
  const usage = Number(value);
  return Number.isFinite(usage) && usage >= 0 ? usage : null;
}

const fileToBase64 = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error(`Không thể đọc file ${file.name}`));
  reader.readAsDataURL(file);
});

const initialInspection = asset => ({
  status: allowedStatuses.includes(asset.inspectionStatus) ? asset.inspectionStatus : 'in_use',
  maintenanceCost: asset.maintenanceCost || '',
  images: asset.images || [],
});

export default function ManagerCheckoutRequestDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [assets, setAssets] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const [electricityInput, setElectricityInput] = useState('');
  const [waterInput, setWaterInput] = useState('');
  const [savingReconciliation, setSavingReconciliation] = useState(false);
  const [inspections, setInspections] = useState({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refundProof, setRefundProof] = useState(null);
  const [readingRefundProof, setReadingRefundProof] = useState(false);
  const [confirmingRefund, setConfirmingRefund] = useState(false);
  const [sendingCheckoutPayment, setSendingCheckoutPayment] = useState(false);
  const refundProofImage = refundProof?.requestId === id ? refundProof.image : '';

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const [detailResponse, inspectionResponse, reconciliationResponse] = await Promise.all([
        terminationRequestsAPI.getManagerRequestDetail(id),
        terminationRequestsAPI.getCheckoutAssetInspection(id),
        terminationRequestsAPI.getCheckoutReconciliation(id),
      ]);
      const detail = detailResponse?.data || detailResponse?.result || null;
      const inspection = inspectionResponse?.data || inspectionResponse?.result || {};
      const reconciliationData = reconciliationResponse?.data || reconciliationResponse?.result || {};
      setRequest(detail);
      setInvoice(inspection.invoice || null);
      setAssets(inspection.assets || []);
      setInspections(Object.fromEntries((inspection.assets || []).map(asset => [asset._id, initialInspection(asset)])));
      setReconciliation(reconciliationData);
      setElectricityInput(reconciliationData.electricityUsed ?? '');
      setWaterInput(reconciliationData.waterUsed ?? '');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể tải thông tin checkout');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const estimatedTotal = useMemo(() => assets.reduce((sum, asset) => {
    const inspection = inspections[asset._id] || {};
    if (inspection.status === 'maintenance') return sum + Math.max(0, Number(inspection.maintenanceCost) || 0);
    if (inspection.status === 'retired') return sum + Number(asset.purchasePrice || 0);
    return sum;
  }, 0), [assets, inspections]);

  const startInspection = async () => {
    try {
      setStarting(true);
      const response = await terminationRequestsAPI.startCheckoutAssetInspection(id);
      const result = response?.data || response?.result || {};
      setInvoice(result.invoice || null);
      setAssets(result.assets || []);
      setInspections(Object.fromEntries((result.assets || []).map(asset => [asset._id, initialInspection(asset)])));
      toast.success('Đã chuẩn bị hóa đơn checkout');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể bắt đầu kiểm tra tài sản');
    } finally {
      setStarting(false);
    }
  };

  const updateInspection = (assetId, patch) => {
    setInspections(current => ({
      ...current,
      [assetId]: { ...current[assetId], ...patch },
    }));
  };

  const handleImages = async (assetId, files) => {
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))) {
      toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (selected.some(file => file.size > 1.5 * 1024 * 1024)) {
      toast.error('Mỗi ảnh không được vượt quá 1.5 MB');
      return;
    }
    try {
      const encoded = await Promise.all(selected.map(fileToBase64));
      const current = inspections[assetId]?.images || [];
      if (current.length + encoded.length > 5) {
        toast.error('Mỗi tài sản chỉ được tải tối đa 5 ảnh');
        return;
      }
      updateInspection(assetId, { images: [...current, ...encoded] });
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveInspection = async () => {
    if (!invoice) return;
    for (const asset of assets) {
      const item = inspections[asset._id];
      if (!item) return toast.error(`Chưa kiểm tra ${asset.name}`);
      if (item.status === 'maintenance') {
        if (item.maintenanceCost === '' || !Number.isFinite(Number(item.maintenanceCost)) || Number(item.maintenanceCost) < 0) {
          return toast.error(`Vui lòng nhập chi phí bảo trì hợp lệ cho ${asset.name}`);
        }
        if (!item.images?.length) return toast.error(`Vui lòng tải ảnh hóa đơn bảo trì cho ${asset.name}`);
      }
    }

    try {
      setSaving(true);
      const payload = {
        assets: assets.map(asset => ({
          assetId: asset._id,
          status: inspections[asset._id].status,
          maintenanceCost: inspections[asset._id].maintenanceCost,
          images: inspections[asset._id].status === 'maintenance' ? inspections[asset._id].images : [],
        })),
      };
      const response = await terminationRequestsAPI.saveCheckoutAssetInspection(id, payload);
      const result = response?.data || response?.result || {};
      setInvoice(result.invoice || null);
      setAssets(result.assets || []);
      setInspections(Object.fromEntries((result.assets || []).map(asset => [asset._id, initialInspection(asset)])));
      toast.success('Đã lưu kết quả kiểm tra tài sản và cập nhật hóa đơn');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể lưu kết quả kiểm tra');
    } finally {
      setSaving(false);
    }
  };


  const electricityUsed = getUsage(electricityInput);
  const waterUsed = getUsage(waterInput);
  const electricityInvalid = electricityInput !== '' && electricityUsed === null;
  const waterInvalid = waterInput !== '' && waterUsed === null;
  const metersReady = electricityUsed !== null && waterUsed !== null;
  const electricityAmount = Math.round(electricityUsed * Number(reconciliation?.electricityPrice || 0));
  const waterAmount = Math.round(waterUsed * Number(reconciliation?.waterPrice || 0));
  const utilityAmount = electricityAmount + waterAmount;
  const penaltyAmount = Number(reconciliation?.penalty?.amount || 0);
  const debtAmount = Number(reconciliation?.previousDebtAmount || 0);
  const assetAmount = Number(invoice?.assetAmount ?? reconciliation?.assetAmount ?? 0);
  const depositAmount = Number(reconciliation?.depositAmount || 0);
  const totalDeductions = debtAmount + assetAmount + utilityAmount + penaltyAmount;
  const depositRefund = Math.max(0, depositAmount - totalDeductions);
  const additionalPayment = Math.max(0, totalDeductions - depositAmount);

  const saveReconciliation = async () => {
    if (!invoice) return toast.error('Vui lòng bắt đầu kiểm tra tài sản trước');
    if (electricityInput === '' || waterInput === '') return toast.error('Vui lòng nhập lượng điện và nước đã dùng.');
    if (!metersReady) return toast.error('Lượng điện và nước đã dùng phải là số không âm.');
    try {
      setSavingReconciliation(true);
      const response = await terminationRequestsAPI.saveCheckoutReconciliation(id, {
        electricityUsed,
        waterUsed,
      });
      const result = response?.data || response?.result || {};
      const saved = result.reconciliation || null;
      setRequest(current => current ? ({ ...current, checkoutReconciliation: saved }) : current);
      setReconciliation(current => ({
        ...current,
        savedReconciliation: saved,
        assetAmount: result.summary?.assetAmount ?? current.assetAmount,
        previousDebtAmount: result.summary?.previousDebtAmount ?? current.previousDebtAmount,
      }));
      if (result.invoice) {
        setInvoice(current => ({ ...current, ...result.invoice, assetAmount: result.summary?.assetAmount ?? current?.assetAmount }));
      }
      toast.success('Đã lưu đối soát điện nước, công nợ và quyết toán tiền cọc');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể lưu đối soát checkout');
    } finally {
      setSavingReconciliation(false);
    }
  };

  const requestCheckoutPayment = async () => {
    if (sendingCheckoutPayment) return;
    try {
      setSendingCheckoutPayment(true);
      const response = await terminationRequestsAPI.requestCheckoutPayment(id);
      toast.success(response?.message || 'Đã gửi yêu cầu thanh toán cho Tenant');
      await loadPage();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể gửi yêu cầu thanh toán');
    } finally {
      setSendingCheckoutPayment(false);
    }
  };

  const handleRefundProof = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return toast.error('Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP');
    }
    if (file.size > 3 * 1024 * 1024) {
      return toast.error('Ảnh biên lai không được vượt quá 3 MB');
    }

    try {
      setReadingRefundProof(true);
      const image = await fileToBase64(file);
      setRefundProof({ requestId: id, image });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setReadingRefundProof(false);
    }
  };

  const confirmRefund = async () => {
    if (!refundProofImage || readingRefundProof || confirmingRefund) return;
    if (!window.confirm('Xác nhận Manager đã thực tế hoàn tiền cọc cho Tenant?')) return;
    try {
      setConfirmingRefund(true);
      await terminationRequestsAPI.confirmCheckoutRefund(id, refundProofImage);
      setRefundProof(null);
      toast.success('Đã xác nhận hoàn tiền cọc');
      await loadPage();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể xác nhận hoàn tiền');
    } finally {
      setConfirmingRefund(false);
    }
  };

  const finalize = async () => {
    if (!window.confirm('Xác nhận checkout cuối cùng? Hợp đồng sẽ chuyển sang terminated và phòng chuyển sang available.')) return;
    try {
      await terminationRequestsAPI.finalizeCheckout(id);
      toast.success('Đã hoàn tất checkout, hợp đồng đã kết thúc và phòng đã được mở');
      await loadPage();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể hoàn tất checkout');
    }
  };

  if (loading) return <div className="mx-auto max-w-6xl p-12 text-center text-slate-500">Đang tải thông tin checkout...</div>;
  if (!request) return <div className="mx-auto max-w-6xl rounded-2xl bg-white p-10 text-center shadow-sm"><p className="font-semibold text-slate-700">Không tìm thấy yêu cầu checkout.</p><Link className="mt-4 inline-block font-semibold text-emerald-700" to="/manager/checkout-requests">Quay lại danh sách</Link></div>;

  const contract = request.contract || {};
  const room = contract.room || {};
  const representative = contract.representative || {};

  return (
    <main className="mx-auto max-w-6xl space-y-6 py-6">
      <Link to="/manager/checkout-requests" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-700"><ArrowLeft size={17}/> Quay lại danh sách</Link>

      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-700"><Building2 size={15}/> Manager workspace</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý checkout</h1>
          <p className="mt-1 text-sm text-slate-500">Kiểm tra tài sản và xử lý các bước trả phòng cho yêu cầu này.</p>
        </div>
        <CheckoutStatusBadge status={request.status}/>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-900">Thông tin yêu cầu checkout</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-slate-500">Phòng</p><p className="mt-1 font-bold text-slate-800">{room.roomNumber || '—'}</p></div>
          <div><p className="text-xs text-slate-500">Người đại diện</p><p className="mt-1 font-bold text-slate-800">{representative.fullName || '—'}</p><p className="text-xs text-slate-500">{representative.email || ''}</p></div>
          <div><p className="text-xs text-slate-500">Ngày gửi yêu cầu</p><p className="mt-1 font-semibold text-slate-800">{dateText(request.requestedDate || request.createdAt)}</p></div>
          <div><p className="text-xs text-slate-500">Ngày trả dự kiến</p><p className="mt-1 font-semibold text-slate-800">{dateText(request.moveOutDate)}</p></div>
        </div>
        <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Lý do trả phòng</p><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{request.reason || 'Không có nội dung.'}</p></div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 font-bold text-slate-900">Các bước quản lý checkout</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-800">1. Kiểm tra tài sản</p><p className="mt-1 text-xs text-emerald-700">Đang triển khai</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-700">2. Đối soát công nợ</p><p className="mt-1 text-xs text-slate-500">Chưa triển khai</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-700">3. Đối soát điện nước</p><p className="mt-1 text-xs text-slate-500">Nhập chỉ số cuối kỳ</p></div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-700">4. Phạt hợp đồng & tiền cọc</p><p className="mt-1 text-xs text-slate-500">Tính phạt và quyết toán</p></div>
        </div>
      </section>

      <section id="checkout-asset-inspection" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex items-center gap-2"><ClipboardCheck className="text-emerald-700" size={20}/><h2 className="font-bold text-slate-900">Kiểm tra tài sản trong phòng</h2></div>
            <p className="mt-1 text-sm text-slate-500">Chọn tình trạng thực tế, ghi chi phí bảo trì và đính kèm ảnh hóa đơn nếu có.</p>
          </div>
          {!invoice ? (
            <button type="button" onClick={startInspection} disabled={starting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
              {starting ? <LoaderCircle className="animate-spin" size={17}/> : <ClipboardCheck size={17}/>}
              {assets.length > 0 ? 'Bắt đầu kiểm tra & tạo hóa đơn' : 'Chuẩn bị hóa đơn checkout'}
            </button>
          ) : (
            <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">Invoice: {String(invoice._id).slice(-8).toUpperCase()}</span>
          )}
        </div>

        {!invoice ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {assets.length > 0
              ? 'Nhấn “Bắt đầu kiểm tra & tạo hóa đơn” để ghi nhận tình trạng tài sản trước khi quyết toán.'
              : 'Phòng này chưa có tài sản được gán. Nhấn “Chuẩn bị hóa đơn checkout” để tiếp tục quyết toán.'}
          </div>
        ) : assets.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Phòng này chưa có tài sản nào được gán.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assets.map((asset, index) => {
              const item = inspections[asset._id] || initialInspection(asset);
              return (
                <article key={asset._id} className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div><p className="text-xs font-semibold text-slate-400">TÀI SẢN {index + 1} {asset.assetCode ? `· ${asset.assetCode}` : ''}</p><h3 className="mt-1 font-bold text-slate-900">{asset.name}</h3><p className="text-xs text-slate-500">{[asset.category, asset.brand, asset.model].filter(Boolean).join(' · ')}</p></div>
                    <p className="text-sm font-semibold text-slate-700">Giá trị tài sản: {money(asset.purchasePrice)}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Tình trạng sau kiểm tra</label>
                      <select value={item.status} onChange={e => updateInspection(asset._id, { status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500">
                        <option value="in_use">Bình thường (in_use)</option>
                        <option value="maintenance">Cần bảo trì (maintenance)</option>
                        <option value="retired">Thanh lý (retired)</option>
                      </select>
                      {item.status === 'retired' && <p className="mt-2 text-xs text-amber-700">Hệ thống sẽ tính {money(asset.purchasePrice)} theo giá trị tài sản đã lưu.</p>}
                    </div>
                    {item.status === 'maintenance' ? (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">Chi phí bảo trì (VNĐ)</label>
                        <input type="number" min="0" step="1" value={item.maintenanceCost} onChange={e => updateInspection(asset._id, { maintenanceCost: e.target.value })} placeholder="Nhập chi phí thực tế" className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-500"/>
                      </div>
                    ) : (
                      <div className="flex items-end"><p className="text-sm text-slate-500">{item.status === 'in_use' ? 'Không phát sinh chi phí.' : 'Không cần nhập chi phí bảo trì.'}</p></div>
                    )}
                  </div>
                  {item.status === 'maintenance' && (
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Ảnh hóa đơn bảo trì (tối đa 5 ảnh, 1.5 MB/ảnh)</label>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"><ImagePlus size={17}/> Chọn ảnh hóa đơn<input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => { handleImages(asset._id, e.target.files); e.target.value = ''; }}/></label>
                      {!!item.images?.length && <div className="mt-3 flex flex-wrap gap-3">{item.images.map((src, imageIndex) => <div key={`${asset._id}-${imageIndex}`} className="relative"><img src={src} alt={`Hóa đơn ${imageIndex + 1}`} className="h-20 w-20 rounded-lg border border-slate-200 object-cover"/><button type="button" onClick={() => updateInspection(asset._id, { images: item.images.filter((_, i) => i !== imageIndex) })} className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white" aria-label="Xóa ảnh"><X size={12}/></button></div>)}</div>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {invoice && assets.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div><p className="text-sm font-bold text-slate-800">Tổng chi phí tài sản dự kiến</p><p className="text-xs text-slate-500">Bình thường: 0đ · Maintenance: chi phí nhập · Retired: giá trị tài sản</p></div>
              <p className="text-2xl font-black text-emerald-700">{money(estimatedTotal)}</p>
            </div>
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-slate-500">Invoice đang được lưu ở trạng thái nháp cho đến khi Manager lưu kết quả kiểm tra.</p>
              <button type="button" onClick={saveInspection} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{saving ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>} Lưu kết quả kiểm tra</button>
            </div>
          </div>
        )}
      </section>

      {/* ĐỐI SOÁT CÔNG NỢ CŨ */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardCheck className="text-blue-700" size={20}/>
          <h2 className="font-bold text-slate-900">Đối soát công nợ trước đó</h2>
        </div>
        {!reconciliation ? (
          <p className="text-sm text-slate-500">Đang tải dữ liệu công nợ...</p>
        ) : reconciliation.debtInvoices?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="p-3">Kỳ hóa đơn</th><th className="p-3">Tổng tiền</th><th className="p-3">Đã trả</th><th className="p-3">Còn nợ</th><th className="p-3">Trạng thái</th></tr>
              </thead>
              <tbody>
                {reconciliation.debtInvoices.map(item => (
                  <tr key={item._id} className="border-t border-slate-100">
                    <td className="p-3 font-medium">{item.billingMonth}</td>
                    <td className="p-3">{money(item.totalAmount)}</td>
                    <td className="p-3">{money(item.paidAmount)}</td>
                    <td className="p-3 font-semibold text-rose-700">{money(item.remainingAmount)}</td>
                    <td className="p-3">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Không có hóa đơn tháng nào còn công nợ.</p>}
        <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
          <p className="font-bold text-slate-800">Tổng công nợ cũ: <span className="text-rose-700">{money(debtAmount)}</span></p>
        </div>
      </section>

      {/* ĐỐI SOÁT ĐIỆN NƯỚC */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <div className="flex items-center gap-2"><ClipboardCheck className="text-amber-600" size={20}/><h2 className="font-bold text-slate-900">Đối soát điện nước tháng checkout</h2></div>
          <p className="mt-1 text-sm text-slate-500">Kỳ checkout: {reconciliation?.billingMonth || '—'}. Nhập lượng điện và nước cần tính trong tháng trả phòng.</p>
        </div>
        {!reconciliation ? <p className="text-sm text-slate-500">Đang tải đơn giá...</p> : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-800">Điện (kWh)</h3>
                <p className="mb-2 text-xs text-slate-500">Đơn giá: {money(reconciliation.electricityPrice)}/kWh</p>
                <label htmlFor="checkout-electricity" className="mb-1 block text-sm text-slate-600">Điện đã dùng (kWh)</label>
                <input id="checkout-electricity" type="number" step="any" min={0} value={electricityInput}
                  onChange={e => setElectricityInput(e.target.value)} aria-invalid={electricityInvalid}
                  aria-describedby={electricityInvalid ? 'checkout-electricity-error' : undefined}
                  className={'w-full rounded-xl border px-3 py-3 outline-none ' + (electricityInvalid ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500')} />
                {electricityInvalid ? (
                  <p id="checkout-electricity-error" className="mt-2 text-sm text-rose-700">
                    Điện đã dùng (kWh) phải là số không âm.
                  </p>
                ) : electricityUsed !== null && (
                  <p className="mt-2 text-sm text-slate-600">Đã dùng: {electricityUsed.toLocaleString('vi-VN')} kWh · Thành tiền: <b>{money(electricityAmount)}</b></p>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-slate-800">Nước (m³)</h3>
                <p className="mb-2 text-xs text-slate-500">Đơn giá: {money(reconciliation.waterPrice)}/m³</p>
                <label htmlFor="checkout-water" className="mb-1 block text-sm text-slate-600">Nước đã dùng (m³)</label>
                <input id="checkout-water" type="number" step="any" min={0} value={waterInput}
                  onChange={e => setWaterInput(e.target.value)} aria-invalid={waterInvalid}
                  aria-describedby={waterInvalid ? 'checkout-water-error' : undefined}
                  className={'w-full rounded-xl border px-3 py-3 outline-none ' + (waterInvalid ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-emerald-500')} />
                {waterInvalid ? (
                  <p id="checkout-water-error" className="mt-2 text-sm text-rose-700">
                    Nước đã dùng (m³) phải là số không âm.
                  </p>
                ) : waterUsed !== null && (
                  <p className="mt-2 text-sm text-slate-600">Đã dùng: {waterUsed.toLocaleString('vi-VN')} m³ · Thành tiền: <b>{money(waterAmount)}</b></p>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end rounded-xl bg-amber-50 p-4">
              <p className="font-bold text-slate-800">Tổng điện nước: <span className="text-amber-700">{metersReady ? money(utilityAmount) : 'Chờ nhập lượng sử dụng'}</span></p>
            </div>
          </>
        )}
      </section>

      {/* PHẠT HỢP ĐỒNG VÀ QUYẾT TOÁN TIỀN CỌC */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2"><ClipboardCheck className="text-purple-700" size={20}/><h2 className="font-bold text-slate-900">Phạt hợp đồng và quyết toán tiền cọc</h2></div>
        {reconciliation && (
          <>
            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-800">Phạt trả phòng trước hạn</h3>
              {reconciliation.penalty?.applies ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">Kỳ tính phạt: {reconciliation.penalty.billingMonth}. Ngày checkout nằm trong tuần {reconciliation.penalty.weekNumber}; {reconciliation.penalty.completedWeeks} tuần đã ở hết không tính phạt.</p>
                  <p className="mt-2 text-sm text-slate-600">Tiền thuê tuần: {money(reconciliation.penalty.weeklyRent)} × {4 - reconciliation.penalty.completedWeeks} tuần.</p>
                  <p className="mt-1 text-lg font-bold text-rose-700">{money(penaltyAmount)}</p>
                </>
              ) : <p className="mt-2 text-sm text-emerald-700">Không phát sinh phạt trả phòng trước hạn.</p>}
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <h3 className="mb-3 font-bold text-slate-900">Tổng hợp tiền cọc</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3"><span>Tiền cọc ban đầu</span><b>{money(depositAmount)}</b></div>
                <div className="flex justify-between gap-3"><span>Công nợ hóa đơn cũ</span><b>{money(debtAmount)}</b></div>
                <div className="flex justify-between gap-3"><span>Chi phí tài sản</span><b>{money(assetAmount)}</b></div>
                <div className="flex justify-between gap-3"><span>Điện nước tháng cuối</span><b>{metersReady ? money(utilityAmount) : '—'}</b></div>
                <div className="flex justify-between gap-3"><span>Phạt hợp đồng</span><b>{money(penaltyAmount)}</b></div>
                <div className="border-t border-slate-200 pt-3 flex justify-between gap-3 font-bold"><span>Tổng khấu trừ</span><span>{metersReady ? money(totalDeductions) : '—'}</span></div>
                {metersReady && (additionalPayment > 0 ? (
                  <div className="flex justify-between gap-3 text-rose-700 font-bold"><span>Tenant cần thanh toán thêm</span><span>{money(additionalPayment)}</span></div>
                ) : (
                  <div className="flex justify-between gap-3 text-emerald-700 font-bold"><span>Tiền cọc hoàn lại Tenant</span><span>{money(depositRefund)}</span></div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              {invoice ? (
                <p className="text-xs text-slate-500">Lưu sẽ cập nhật hóa đơn checkout và lưu bản đối soát vào yêu cầu trả phòng. Công nợ cũ vẫn nằm trong các hóa đơn gốc.</p>
              ) : (
                <a href="#checkout-asset-inspection" className="text-sm font-semibold text-purple-700 underline">
                  Tạo hóa đơn checkout ở mục Kiểm tra tài sản để mở nút lưu.
                </a>
              )}
              <button type="button" onClick={saveReconciliation} disabled={savingReconciliation || !invoice || !metersReady} className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 py-3 text-sm font-bold text-white hover:bg-purple-800 disabled:opacity-60">
                {savingReconciliation ? <LoaderCircle className="animate-spin" size={17}/> : <Save size={17}/>} Lưu đối soát & quyết toán
              </button>
            </div>
            {reconciliation.savedReconciliation?.calculatedAt && <p className="mt-3 text-right text-xs text-emerald-700">Đã lưu đối soát lúc {new Date(reconciliation.savedReconciliation.calculatedAt).toLocaleString('vi-VN')}</p>}
          </>
        )}
      </section>

      {/* THANH TOÁN / HOÀN CỌC VÀ XÁC NHẬN CHECKOUT CUỐI */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <h2 className="font-bold text-slate-900">5. Thanh toán, hoàn cọc và hoàn tất checkout</h2>
          <p className="mt-1 text-sm text-slate-500">Các thao tác dưới đây không tự kết thúc hợp đồng. Chỉ nút xác nhận cuối cùng của Manager mới đổi trạng thái hợp đồng và phòng.</p>
        </div>
        {(() => {
          const saved = request.checkoutReconciliation || reconciliation?.savedReconciliation;
          const refund = Number(saved?.depositRefund || 0);
          const extra = Number(saved?.additionalPayment || 0);
          const settlement = request.checkoutSettlement || {};
          const { bankName, accountNumber, accountHolder } = request.refundBankAccount ?? {};
          const refundNeeded = refund >= 10000;
          const paymentNeeded = extra > 0;
          const refundConfirmed = Boolean(settlement.refundConfirmedAt && settlement.refundProofImage);
          const canSettle = !['completed', 'rejected'].includes(request.status);
          const ready = canSettle && Boolean(saved?.calculatedAt)
            && (!refundNeeded || refundConfirmed)
            && (!paymentNeeded || (
              Boolean(settlement.paymentRequestedAt)
              && Boolean(settlement.paymentCompleted)
            ));
          return (
            <div className="space-y-4">
              {!saved?.calculatedAt ? (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Vui lòng lưu quyết toán tiền cọc trước khi thực hiện bước thanh toán hoặc hoàn tiền.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Số tiền cần hoàn cho Tenant</p>
                    <p className="mt-1 text-xl font-black text-emerald-700">{money(refund)}</p>
                    {refundNeeded ? (
                      refundConfirmed
                        ? <p className="mt-2 text-xs font-semibold text-emerald-700">Đã xác nhận hoàn tiền lúc {new Date(settlement.refundConfirmedAt).toLocaleString('vi-VN')}</p>
                        : <p className="mt-2 text-xs text-amber-700">Manager cần hoàn tiền thực tế và xác nhận tại đây.</p>
                    ) : <p className="mt-2 text-xs text-slate-500">Dưới 10.000đ hoặc không có tiền hoàn, bỏ qua bước hoàn tiền.</p>}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Tenant cần thanh toán thêm</p>
                    <p className="mt-1 text-xl font-black text-rose-700">{money(extra)}</p>
                    {paymentNeeded ? (
                      settlement.paymentRequestedAt
                        ? <p className="mt-2 text-xs font-semibold text-blue-700">Đã gửi yêu cầu lúc {new Date(settlement.paymentRequestedAt).toLocaleString('vi-VN')}. Tenant thanh toán tại mục Hóa đơn của tôi.</p>
                        : <p className="mt-2 text-xs text-amber-700">Tạo hóa đơn trả phòng cho số tiền còn thiếu và gửi thông báo cho khách thuê.</p>
                    ) : <p className="mt-2 text-xs text-slate-500">Không phát sinh khoản cần thanh toán thêm.</p>}
                  </div>
                </div>
              )}

              {saved?.calculatedAt && refundNeeded && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <h3 className="text-sm font-bold text-slate-900">Thông tin tài khoản nhận hoàn cọc</h3>
                  {bankName || accountNumber || accountHolder ? (
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-600">Ngân hàng</dt>
                        <dd className="mt-1 break-words font-semibold text-slate-900">{bankName || 'Chưa cung cấp'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-600">Số tài khoản</dt>
                        <dd className="mt-1 select-all break-words font-semibold tabular-nums text-slate-900">{accountNumber || 'Chưa cung cấp'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs text-slate-600">Chủ tài khoản</dt>
                        <dd className="mt-1 break-words font-semibold text-slate-900">{accountHolder || 'Chưa cung cấp'}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">Yêu cầu này chưa có thông tin tài khoản ngân hàng.</p>
                  )}
                </div>
              )}

              {refundConfirmed && (
                <img src={settlement.refundProofImage} alt="Biên lai hoàn cọc đã lưu" className="max-h-64 max-w-full rounded-xl border border-slate-200 object-contain" />
              )}

              {canSettle && saved?.calculatedAt && refundNeeded && !refundConfirmed && (
                <div className="space-y-3 rounded-xl border border-emerald-200 p-4">
                  <label htmlFor="refund-proof" className="block text-sm font-bold text-slate-800">
                    Ảnh biên lai chuyển khoản hoàn cọc
                  </label>
                  <input
                    id="refund-proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={readingRefundProof || confirmingRefund}
                    onChange={handleRefundProof}
                    aria-describedby="refund-proof-help"
                    className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-800"
                  />
                  <p id="refund-proof-help" className="text-xs text-slate-500">Chọn ảnh JPG, PNG hoặc WEBP, tối đa 3 MB.</p>
                  {refundProofImage && (
                    <div className="flex items-start gap-3">
                      <img src={refundProofImage} alt="Xem trước biên lai hoàn cọc" className="max-h-48 max-w-[80%] rounded-lg border border-slate-200 object-contain" />
                      <button type="button" disabled={readingRefundProof || confirmingRefund} onClick={() => setRefundProof(null)} aria-label="Xóa ảnh biên lai" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <button type="button" onClick={confirmRefund} disabled={!refundProofImage || readingRefundProof || confirmingRefund} className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50">
                    {confirmingRefund ? 'Đang lưu xác nhận...' : `Xác nhận đã hoàn ${money(refund)} cho Tenant`}
                  </button>
                </div>
              )}

              {canSettle && saved?.calculatedAt && paymentNeeded && !settlement.paymentRequestedAt && (
                <button type="button" disabled={sendingCheckoutPayment} onClick={requestCheckoutPayment} className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">
                  {sendingCheckoutPayment ? 'Đang tạo hóa đơn...' : `Tạo và gửi hóa đơn trả phòng ${money(extra)}`}
                </button>
              )}

              {settlement.paymentRequestedAt && paymentNeeded && (
                <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                  Khách thuê xem yêu cầu thanh toán trong mục <b>Hóa đơn của tôi</b>.
                  {settlement.paymentCompleted
                    ? <p className="mt-1 font-semibold text-emerald-700">Đã thanh toán đủ số tiền còn thiếu khi trả phòng.</p>
                    : <p className="mt-1 text-xs">Đang chờ thanh toán đủ. Sau khi cổng thanh toán xác nhận, tải lại trang để cập nhật trạng thái.</p>}
                  <p className="mt-1 text-xs">Hệ thống kiểm tra trạng thái hóa đơn ở backend trước khi cho phép hoàn tất.</p>
                </div>
              )}

              <button type="button" onClick={finalize} disabled={!ready || request.status === 'completed'} className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">
                {request.status === 'completed' ? 'Checkout đã hoàn tất' : 'Manager xác nhận checkout cuối cùng · Kết thúc hợp đồng & mở phòng'}
              </button>
              {canSettle && !ready && saved?.calculatedAt && (
                <p className="text-center text-xs text-slate-500">
                  {refundNeeded && !refundConfirmed
                    ? 'Chưa xác nhận hoàn tiền cọc.'
                    : paymentNeeded && !settlement.paymentRequestedAt
                      ? 'Chưa gửi yêu cầu thanh toán cho Tenant.'
                      : 'Đang chờ các điều kiện checkout hoàn tất.'}
                </p>
              )}
            </div>
          );
        })()}
      </section>
    </main>
  );
}
