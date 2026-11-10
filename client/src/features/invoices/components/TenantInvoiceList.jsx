import { ArrowRight, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/utils/format';
import InvoicePaymentButton from './InvoicePaymentButton';
import InvoiceStatusBadge from './InvoiceStatusBadge';

export default function TenantInvoiceList({ invoices, payingInvoiceId, onPay }) {
  if (!invoices.length) {
    return (
      <section className="rounded-3xl border border-white bg-white/85 p-8 text-center shadow-card">
        <ReceiptText size={28} className="mx-auto mb-3 text-primary" />
        <p className="font-bold text-content-main">Bạn không có khoản thanh toán nào</p>
      </section>
    );
  }

  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {invoices.map(invoice => {
        const room = invoice.contract?.room;
        const [year, month] = invoice.billingMonth.split('-');
        const title = invoice.invoiceType === 'checkout_asset'
          ? 'Hóa đơn quyết toán trả phòng'
          : `Hóa đơn tháng ${month}/${year}`;
        const balance = invoice.status === 'cancelled' ? 0 : Math.max(0, invoice.totalAmount - (invoice.paidAmount ?? 0));

        return (
          <li key={invoice._id} className="rounded-3xl border border-white bg-white/90 p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-content-main">{title}</h2>
                <p className="mt-1 text-sm text-content-sub">
                  {room?.property?.name || 'Nhà trọ'} · Phòng {room?.roomNumber || '—'}
                </p>
              </div>
              <InvoiceStatusBadge status={invoice.status} />
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-surface-bg p-3 text-sm">
              <div>
                <dt className="text-content-sub">Còn phải trả</dt>
                <dd className="mt-1 font-extrabold text-primary-dark">{formatCurrency(balance)}</dd>
              </div>
              <div>
                <dt className="text-content-sub">Hạn thanh toán</dt>
                <dd className="mt-1 font-bold text-content-main">{formatDate(invoice.dueDate)}</dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <Link
                to={`/invoices/my/${invoice._id}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary-dark hover:underline"
              >
                Xem chi tiết <ArrowRight size={16} />
              </Link>
              <InvoicePaymentButton invoice={invoice} payingInvoiceId={payingInvoiceId} onPay={onPay} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
