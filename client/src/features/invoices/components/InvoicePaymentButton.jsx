import { CreditCard } from 'lucide-react';

export default function InvoicePaymentButton({ invoice, payingInvoiceId, onPay }) {
  const balance = invoice.totalAmount - (invoice.paidAmount ?? 0);
  if (
    !invoice.canPay || !invoice.sentAt || !invoice.contract?.room?._id || balance <= 0 ||
    !['unpaid', 'partially_paid', 'overdue'].includes(invoice.status)
  ) return null;

  return (
    <button
      type="button"
      disabled={Boolean(payingInvoiceId)}
      onClick={() => onPay(invoice)}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-emerald px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <CreditCard size={16} /> {payingInvoiceId === invoice._id ? 'Đang mở VNPay…' : 'Thanh toán'}
    </button>
  );
}
