import { ReceiptText } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import InvoiceItemsTable from './InvoiceItemsTable';
import InvoiceStatusBadge from './InvoiceStatusBadge';

export default function InvoiceDetail({ invoice, paymentAction }) {
  const room = invoice.contract?.room;
  const [year, month] = invoice.billingMonth.split('-');
  const paidAmount = invoice.paidAmount ?? 0;
  const balance = invoice.status === 'cancelled' ? 0 : Math.max(0, invoice.totalAmount - paidAmount);
  const images = (invoice.images || []).filter(image => typeof image === 'string' && image.trim());

  return (
    <section className="space-y-5 rounded-3xl border border-white bg-white/90 p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-primary-50 p-3 text-primary-dark"><ReceiptText size={22} /></span>
          <div>
            <h2 className="text-lg font-extrabold text-content-main">Hóa đơn tháng {month}/{year}</h2>
            <p className="mt-1 text-sm text-content-sub">
              {room?.property?.name || 'Nhà trọ'} · Phòng {room?.roomNumber || '—'}
            </p>
            {room?.property?.address && <p className="mt-1 text-sm text-content-sub">{room.property.address}</p>}
          </div>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <dl className="grid gap-4 rounded-2xl bg-surface-bg p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-content-sub">Mã hóa đơn</dt>
          <dd className="mt-1 break-all font-bold text-content-main">{invoice._id}</dd>
        </div>
        <div>
          <dt className="text-content-sub">Người đứng tên hóa đơn</dt>
          <dd className="mt-1 font-bold text-content-main">{invoice.billedToName || '—'}</dd>
        </div>
        <div>
          <dt className="text-content-sub">Ngày gửi</dt>
          <dd className="mt-1 font-bold text-content-main">{formatDate(invoice.sentAt)}</dd>
        </div>
        <div>
          <dt className="text-content-sub">Hạn thanh toán</dt>
          <dd className="mt-1 font-bold text-content-main">{formatDate(invoice.dueDate)}</dd>
        </div>
      </dl>

      <InvoiceItemsTable items={invoice.items} />

      <dl className="grid gap-4 rounded-2xl bg-primary-50 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-primary-900">Tổng hóa đơn</dt>
          <dd className="mt-1 font-extrabold text-primary-900">{formatCurrency(invoice.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-sm text-primary-900">Đã thanh toán</dt>
          <dd className="mt-1 font-extrabold text-primary-900">{formatCurrency(paidAmount)}</dd>
        </div>
        <div>
          <dt className="text-sm text-primary-900">Còn phải trả</dt>
          <dd className="mt-1 text-xl font-black text-primary-900">{formatCurrency(balance)}</dd>
        </div>
      </dl>

      {paymentAction && <div className="flex justify-end">{paymentAction}</div>}

      {images.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-extrabold text-content-main">Ảnh đính kèm</h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image, index) => (
              <li key={index} className="overflow-hidden rounded-xl border border-surface-border bg-surface-bg">
                <img src={image} alt={`Ảnh đính kèm ${index + 1}`} loading="lazy" className="aspect-[4/3] w-full object-contain" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
