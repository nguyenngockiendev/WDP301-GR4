import { CheckCircle2, ReceiptText, Save } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import InvoiceItemsTable from './InvoiceItemsTable';

export default function InvoicePreview({ invoice, contract, property, billingMonth, created, busy, creating, createInvoice }) {
  const period = invoice.billingMonth || billingMonth;
  const [year, month] = period.split('-');

  return (
    <section className="rounded-3xl border border-white bg-white/90 p-4 shadow-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl bg-primary-50 p-3 text-primary-dark"><ReceiptText size={22} /></span>
          <div>
            <h2 className="text-lg font-extrabold text-content-main">{created ? 'Hóa đơn đã tạo' : 'Chi tiết hóa đơn xem trước'}</h2>
            <p className="mt-1 text-sm text-content-sub">
              {property?.name} · Phòng {contract?.room?.roomNumber || '—'} · Kỳ {month}/{year}
            </p>
          </div>
        </div>
        {created && (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-dark">
            <CheckCircle2 size={15} /> Đã tạo
          </span>
        )}
      </div>

      <div className="my-5 grid gap-3 rounded-2xl bg-surface-bg p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-content-sub">Người đại diện hợp đồng</p>
          <p className="mt-1 font-bold text-content-main">{contract?.representative?.fullName || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-content-sub">Hạn thanh toán</p>
          <p className="mt-1 font-bold text-content-main">{formatDate(invoice.dueDate)}</p>
        </div>
      </div>

      <InvoiceItemsTable items={invoice.items} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary-50 p-4">
        <div>
          <p className="text-sm font-bold text-primary-900">{created ? 'Tổng hóa đơn' : 'Tổng tiền xem trước'}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-primary-900">{formatCurrency(invoice.totalAmount)}</p>
        </div>
        {created ? (
          <p role="status" className="text-sm font-semibold text-primary-dark">Hóa đơn đã được lưu.</p>
        ) : (
          <button
            type="button" disabled={busy} onClick={createInvoice}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-emerald px-4 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={16} /> {creating ? 'Đang tạo…' : 'Tạo hóa đơn'}
          </button>
        )}
      </div>
    </section>
  );
}
