import { ArrowLeft, ReceiptText, RotateCw, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import InvoiceDetail from '../components/InvoiceDetail';
import InvoicePaymentButton from '../components/InvoicePaymentButton';
import TenantInvoiceList from '../components/TenantInvoiceList';
import useInvoicePayment from '../hooks/useInvoicePayment';
import useTenantInvoices from '../hooks/useTenantInvoices';
import { formatCurrency } from '../../../shared/utils/format';

const typeFilters = [
  ['all', 'Tất cả loại'],
  ['deposit', 'Tiền cọc'],
  ['monthly', 'Hóa đơn tháng'],
  ['checkout', 'Trả phòng'],
];
const statusFilters = [
  ['all', 'Mọi trạng thái'],
  ['unpaid', 'Còn phải trả'],
  ['paid', 'Đã thanh toán'],
];

function isOutstanding(invoice) {
  return !invoice.checkoutPaymentInvoice
    && ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status)
    && invoice.totalAmount > (invoice.paidAmount ?? 0);
}

function FilterGroup({ label, filters, selected, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-content-sub">{label}</p>
      <div role="group" aria-label={label} className="flex w-fit flex-wrap gap-1 rounded-xl border border-surface-border bg-surface-bg p-1">
        {filters.map(([value, text]) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onChange(value)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${selected === value ? 'bg-primary-900 text-white' : 'text-content-sub hover:bg-white'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TenantInvoicesPage() {
  const { invoiceId } = useParams();
  const { data, loading, error, reload } = useTenantInvoices(invoiceId);
  const { payInvoice, payingInvoiceId, paymentError } = useInvoicePayment();
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const invoices = !invoiceId && Array.isArray(data) ? data : [];
  const filteredInvoices = invoices.filter(invoice => {
    const invoiceType = invoice.invoiceType ?? 'monthly';
    const type = ['checkout_asset', 'checkout_payment'].includes(invoiceType) ? 'checkout' : invoiceType;
    if (typeFilter !== 'all' && typeFilter !== type) return false;
    if (statusFilter === 'paid') return invoice.status === 'paid';
    if (statusFilter === 'unpaid') return isOutstanding(invoice);
    return true;
  });
  const payableInvoices = invoices.filter(invoice => invoice.canPay && isOutstanding(invoice));
  const amountDue = payableInvoices.reduce((total, invoice) => total + invoice.totalAmount - (invoice.paidAmount ?? 0), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5 py-6 sm:py-8">
      {invoiceId ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary-dark">Dịch vụ &amp; tài chính</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-content-main sm:text-3xl">Chi tiết hóa đơn</h1>
            <p className="mt-1 text-sm text-content-sub">Xem các khoản thu, hạn thanh toán và số tiền còn phải trả.</p>
          </div>
          <Link to="/invoices/my" className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-bold text-content-sub hover:text-primary-dark">
            <ArrowLeft size={16} aria-hidden="true" /> Danh sách hóa đơn
          </Link>
        </div>
      ) : (
        <header className="relative isolate overflow-hidden rounded-3xl bg-emerald-950 p-6 text-white sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 -z-10 h-96 w-96 rounded-full border-[36px] border-emerald-400/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border border-emerald-400/25" />
          <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(16rem,21rem)] md:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-200">
                <ReceiptText size={16} aria-hidden="true" /> Dịch vụ &amp; tài chính
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Hóa đơn của tôi</h1>
              <p className="mt-2 text-sm text-emerald-100">Theo dõi tiền cọc, hóa đơn tháng và các khoản quyết toán trả phòng.</p>
            </div>
            {data && (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Wallet size={17} aria-hidden="true" /> Bạn cần thanh toán</p>
                <p className="mt-2 break-words text-3xl font-extrabold tabular-nums">{formatCurrency(amountDue)}</p>
                <p className="mt-2 text-xs text-emerald-100">{payableInvoices.length} hóa đơn còn phải trả</p>
              </div>
            )}
          </div>
        </header>
      )}

      {loading && <p role="status" className="rounded-xl bg-white p-4 text-sm text-content-sub">Đang tải hóa đơn…</p>}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
          <p role="alert">{error}</p>
          <button type="button" onClick={reload} className="mt-2 font-bold underline">Thử lại</button>
        </div>
      )}
      {paymentError && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{paymentError}</p>}
      {data && invoiceId && (
        <InvoiceDetail
          invoice={data}
          paymentAction={<InvoicePaymentButton invoice={data} payingInvoiceId={payingInvoiceId} onPay={payInvoice} />}
        />
      )}
      {data && !invoiceId && (
        <section aria-labelledby="invoice-list-title" className="space-y-4">
          <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 id="invoice-list-title" className="text-lg font-extrabold text-content-main">Danh sách hóa đơn</h2>
                <span aria-live="polite" className="text-xs font-semibold text-content-sub">{filteredInvoices.length}/{invoices.length} hóa đơn</span>
              </div>
              <button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-3 py-2 text-xs font-bold text-primary-dark hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <RotateCw size={14} aria-hidden="true" /> Làm mới
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
              <FilterGroup label="Loại hóa đơn" filters={typeFilters} selected={typeFilter} onChange={setTypeFilter} />
              <FilterGroup label="Trạng thái" filters={statusFilters} selected={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>
          <TenantInvoiceList invoices={filteredInvoices} payingInvoiceId={payingInvoiceId} onPay={payInvoice} />
        </section>
      )}
    </div>
  );
}
