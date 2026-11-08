import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, PencilLine } from 'lucide-react';
import Modal, { btnPrimary, btnGhost, inputCls, labelCls } from '../../../shared/components/Modal';

// Dữ liệu mẫu để xem trước (chỉ hiển thị, không lưu)
const SAMPLE_VALUES = {
  landlordName: 'Nguyễn Văn A',
  landlordPhone: '0901 234 567',
  propertyName: 'Tòa Nhà Bình An',
  propertyAddress: '123 Đường ABC, Quận 1, TP.HCM',
  roomNumber: '101',
  roomArea: '25',
  tenantName: 'Trần Thị B',
  tenantPhone: '0912 345 678',
  tenantEmail: 'tranthib@example.com',
  otherMembers: '1. Lê Văn C - 0987 654 321',
  memberCount: '2',
  startDate: '01/12/2026',
  endDate: '01/12/2027',
  monthlyRent: '3.500.000 đồng',
  depositAmount: '3.500.000 đồng',
  paymentDueDay: '5',
  electricityPrice: '3.500',
  waterPrice: '20.000',
  createdByName: 'Phạm Quản Lý',
  today: new Date().toLocaleDateString('vi-VN'),
};

const DEFAULT_CONTENT = `HỢP ĐỒNG THUÊ PHÒNG TRỌ

Hôm nay, ngày {{today}}, tại {{propertyName}} - {{propertyAddress}}, chúng tôi gồm:

BÊN CHO THUÊ (Bên A): {{landlordName}} - SĐT: {{landlordPhone}}
BÊN THUÊ (Bên B): {{tenantName}} - SĐT: {{tenantPhone}} - Email: {{tenantEmail}}
Người ở cùng:
{{otherMembers}}

Điều 1. Bên A cho Bên B thuê phòng số {{roomNumber}}, diện tích {{roomArea}} m², tối đa {{memberCount}} người ở.
Điều 2. Thời hạn thuê từ ngày {{startDate}} đến ngày {{endDate}}.
Điều 3. Giá thuê {{monthlyRent}}/tháng, đóng trước ngày {{paymentDueDay}} hằng tháng. Tiền đặt cọc: {{depositAmount}}.
Điều 4. Giá điện {{electricityPrice}} đ/kWh, giá nước {{waterPrice}} đ/m³.
Điều 5. Hai bên cam kết thực hiện đúng các điều khoản trên.

Người lập hợp đồng: {{createdByName}}

        BÊN A                                   BÊN B
   (Ký, ghi rõ họ tên)                    (Ký, ghi rõ họ tên)`;

const fill = (content, values) =>
  String(content || '').replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (whole, key) => (key in values ? values[key] : whole));

export default function TemplateForm({ template, properties = [], placeholders, onSubmit, onCancel }) {
  const isEdit = Boolean(template);
  const [property, setProperty] = useState(String(template?.property?._id || template?.property || localStorage.getItem('currentPropertyId') || ''));
  const [title, setTitle] = useState(template?.title || '');
  const [content, setContent] = useState(template?.content || DEFAULT_CONTENT);
  const [status, setStatus] = useState(template?.status || 'active');
  const [tab, setTab] = useState('edit');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const textareaRef = useRef(null);

  const knownKeys = useMemo(() => new Set(placeholders.map(p => p.key)), [placeholders]);
  const unknownKeys = useMemo(() => {
    const found = new Set();
    for (const m of content.matchAll(/\{\{\s*([a-zA-Z]+)\s*\}\}/g)) if (!knownKeys.has(m[1])) found.add(m[1]);
    return [...found];
  }, [content, knownKeys]);

  // Chèn biến tại vị trí con trỏ
  const insertPlaceholder = key => {
    const el = textareaRef.current;
    const token = `{{${key}}}`;
    if (!el) {
      setContent(c => c + token);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + token + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const nextErrors = {};
    if (!properties.some(p => p._id === property)) nextErrors.property = 'Vui lòng chọn tòa nhà áp dụng';
    if (!title.trim()) nextErrors.title = 'Vui lòng nhập tên mẫu';
    if (!content.trim()) nextErrors.content = 'Vui lòng nhập nội dung mẫu';
    if (unknownKeys.length) nextErrors.content = `Biến không hợp lệ: ${unknownKeys.map(k => `{{${k}}}`).join(', ')}`;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      if (nextErrors.content) setTab('edit');
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit({ title: title.trim(), content, status, property });
    } catch {
      toast.error('Lỗi khi lưu mẫu hợp đồng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Cập nhật mẫu hợp đồng' : 'Tạo mẫu hợp đồng'}
      subtitle="Dùng các biến {{...}} để quản lý tự điền thông tin khi lập hợp đồng"
      onClose={onCancel}
      maxWidth="max-w-4xl"
      disabled={submitting}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onCancel} disabled={submitting}>Hủy</button>
          <button type="submit" form="template-form" className={btnPrimary} disabled={submitting}>
            {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mẫu'}
          </button>
        </>
      }
    >
      <form id="template-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Tòa nhà áp dụng *</label>
          <select className={inputCls} value={property} onChange={e => setProperty(e.target.value)}>
            <option value="">— Chọn tòa nhà —</option>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name} — {p.address}</option>)}
          </select>
          {errors.property && <p className="mt-1 text-xs text-rose-500">{errors.property}</p>}
          <p className="mt-1 text-xs text-slate-500">Chỉ quản lý được phân công cho tòa nhà này được dùng mẫu để lập hợp đồng.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className={labelCls}>Tên mẫu *</label>
            <input
              className={inputCls}
              value={title}
              maxLength={200}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Hợp đồng thuê phòng 12 tháng"
            />
            {errors.title && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.title}</p>}
          </div>
          <div>
            <label className={labelCls}>Trạng thái</label>
            <select className={inputCls} value={status} onChange={e => setStatus(e.target.value)}>
              <option value="active">Đang dùng</option>
              <option value="inactive">Ngừng dùng</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Chèn biến (bấm để chèn vào vị trí con trỏ)</label>
          <div className="flex flex-wrap gap-1.5">
            {placeholders.map(p => (
              <button
                key={p.key}
                type="button"
                title={`{{${p.key}}}`}
                onClick={() => insertPlaceholder(p.key)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-100 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            {[
              { value: 'edit', label: 'Soạn nội dung', icon: PencilLine },
              { value: 'preview', label: 'Xem trước', icon: Eye },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    tab === t.value ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50'
                  }`}
                >
                  <Icon size={12} /> {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'edit' ? (
            <textarea
              ref={textareaRef}
              className={`${inputCls} font-mono text-[13px] leading-relaxed`}
              rows={16}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 max-h-[420px] overflow-y-auto">
              <p className="text-[11px] font-semibold text-amber-600 mb-3">Xem trước với dữ liệu mẫu</p>
              <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{fill(content, SAMPLE_VALUES)}</div>
            </div>
          )}
          {errors.content && <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.content}</p>}
          {!errors.content && unknownKeys.length > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-amber-600">
              Biến chưa đúng tên: {unknownKeys.map(k => `{{${k}}}`).join(', ')}
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
