import { ArrowRight, CalendarDays, ClipboardCheck, KeyRound, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import InvoicePaymentButton from './InvoicePaymentButton';
import InvoiceStatusBadge from './InvoiceStatusBadge';

export default function TenantInvoiceList({ invoices, payingInvoiceId, onPay }) {
  if (!invoices.length) {
    return (
      <section className="rounded-2xl border border-dashed border-surface-border bg-white/85 px-5 py-10 text-center">
        <ReceiptText size={28} className="mx-auto mb-3 text-primary" />
        <p className="font-bold text-content-main">Không có hóa đơn phù hợp</p>
      </section>
    );
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {invoices.map(invoice => {
        const room = invoice.contract?.room;
        const [year, month] = (invoice.billingMonth || '').split('-');
        const isCheckout = ['checkout_asset', 'checkout_payment'].includes(invoice.invoiceType);
        const isDeposit = invoice.invoiceType === 'deposit';
        const Icon = isCheckout ? ClipboardCheck : isDeposit ? KeyRound : ReceiptText;
        const title = isCheckout
          ? 'Hóa đơn quyết toán trả phòng'
          : isDeposit ? 'Hóa đơn tiền đặt cọc' : month ? `Hóa đơn tháng ${month}/${year}` : 'Hóa đơn tháng';
        const balance = invoice.status === 'cancelled' ? 0 : Math.max(0, invoice.totalAmount - (invoice.paidAmount ?? 0));
        const transferred = Boolean(invoice.checkoutPaymentInvoice && balance > 0);

        return (
          <li key={invoice._id} className="flex min-w-0 flex-col rounded-2xl border border-surface-border bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDeposit ? 'bg-amber-50 text-amber-700' : isCheckout ? 'bg-teal-50 text-teal-700' : 'bg-primary-50 text-primary-dark'}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="break-words text-base font-extrabold leading-tight text-content-main">{title}</h3>
                  <p className="mt-1 break-words text-xs text-content-sub">
                    Phòng {room?.roomNumber || '—'}{room?.property?.name && ` · ${room.property.name}`}
                  </p>
                </div>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <dl className="mb-4 mt-4 grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl bg-surface-bg p-3 text-xs">
              <div className="col-span-2 border-b border-surface-border pb-3">
                <dt className="text-content-sub">Còn phải trả</dt>
                <dd className={`mt-1 break-words font-extrabold tabular-nums ${balance > 0 && !transferred ? 'text-lg text-primary-dark' : 'text-sm text-content-main'}`}>
                  {transferred ? 'Đã gộp vào hóa đơn trả phòng' : formatCurrency(balance)}
                </dd>
              </div>
              <div>
                <dt className="text-content-sub">Tổng hóa đơn</dt>
                <dd className="mt-1 break-words font-bold tabular-nums text-content-main">{formatCurrency(invoice.totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-content-sub">Đã thanh toán</dt>
                <dd className="mt-1 break-words font-bold tabular-nums text-content-main">{formatCurrency(invoice.paidAmount ?? 0)}</dd>
              </div>
            </dl>

            <div className="mt-auto space-y-3">
              <p className="flex items-center gap-1.5 text-xs text-content-sub">
                <CalendarDays size={14} aria-hidden="true" /> Hạn thanh toán <strong className="text-content-main">{formatDate(invoice.dueDate)}</strong>
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-3">
                <Link
                  to={`/invoices/my/${invoice._id}`}
                  className="inline-flex items-center gap-2 rounded text-sm font-bold text-primary-dark hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Xem chi tiết <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <InvoicePaymentButton invoice={invoice} payingInvoiceId={payingInvoiceId} onPay={onPay} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
