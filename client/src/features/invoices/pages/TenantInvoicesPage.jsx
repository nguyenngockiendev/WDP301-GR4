import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import InvoiceDetail from '../components/InvoiceDetail';
import InvoicePaymentButton from '../components/InvoicePaymentButton';
import TenantInvoiceList from '../components/TenantInvoiceList';
import useInvoicePayment from '../hooks/useInvoicePayment';
import useTenantInvoices from '../hooks/useTenantInvoices';

export default function TenantInvoicesPage() {
  const { invoiceId } = useParams();
  const { data, loading, error, reload } = useTenantInvoices(invoiceId);
  const { payInvoice, payingInvoiceId, paymentError } = useInvoicePayment();
  const [filter, setFilter] = useState('all');
  const invoices = !invoiceId && Array.isArray(data) ? data : [];
  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'paid') return invoice.status === 'paid';
    if (filter === 'unpaid') return ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status)
      && invoice.totalAmount > (invoice.paidAmount ?? 0);
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary-dark">Dịch vụ &amp; tài chính</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-content-main sm:text-3xl">
            {invoiceId ? 'Chi tiết hóa đơn' : 'Hóa đơn của tôi'}
          </h1>
          <p className="mt-1 text-sm text-content-sub">Xem các khoản thu, hạn thanh toán và số tiền còn phải trả.</p>
        </div>
        {invoiceId && (
          <Link to="/invoices/my" className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-bold text-content-sub hover:text-primary-dark">
            <ArrowLeft size={16} /> Danh sách hóa đơn
          </Link>
        )}
      </div>

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
      {data && !invoiceId && <>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3">
          {[['all', 'Tất cả'], ['unpaid', 'Còn phải trả'], ['paid', 'Đã thanh toán']].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}
              className={`rounded-xl px-4 py-2 text-sm font-bold ${filter === value ? 'bg-primary text-white' : 'text-content-sub hover:bg-surface-bg'}`}>
              {label}
            </button>
          ))}
          <span className="ml-auto text-sm text-content-sub">{filteredInvoices.length} hóa đơn</span>
          <button type="button" onClick={reload} className="rounded-xl border border-surface-border px-3 py-2 text-sm font-bold text-primary-dark">Làm mới</button>
        </div>
        <TenantInvoiceList invoices={filteredInvoices} payingInvoiceId={payingInvoiceId} onPay={payInvoice} />
      </>}
    </div>
  );
}
