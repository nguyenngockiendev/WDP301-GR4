import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/format';
import useInvoicePaymentStatus from '../hooks/useInvoicePaymentStatus';

export default function InvoicePaymentResultPage() {
  const { paymentCode } = useParams();
  const [searchParams] = useSearchParams();
  const { payment, loading, error, refresh } = useInvoicePaymentStatus(paymentCode);
  const success = payment?.status === 'success';
  const pending = payment?.status === 'pending';
  const isDeposit = payment?.invoiceType === 'deposit';
  const checkoutOutcome = searchParams.get('checkout');
  const checkoutInterrupted = pending && ['cancel', 'error'].includes(checkoutOutcome);
  const Icon = success ? CheckCircle2 : pending || loading ? Clock : XCircle;
  let title = 'Thanh toán chưa thành công';
  if (success)
    title = payment.invoiceStatus === 'paid'
      ? (isDeposit ? 'Đã đóng cọc' : 'Hóa đơn đã thanh toán')
      : 'Thanh toán thành công';
  if (pending || loading) title = 'Đang chờ xác nhận thanh toán';
  if (error) title = 'Không tải được kết quả thanh toán';

  return (
    <section className="mx-auto mt-8 max-w-2xl space-y-4 rounded-3xl border border-white bg-white/90 p-6 text-center shadow-card sm:p-8">
      <Icon
        size={36}
        className={`mx-auto ${success ? 'text-primary' : pending || loading ? 'text-amber-600' : 'text-rose-600'}`}
      />
      <h1 role="status" className="text-2xl font-black text-content-main">
        {title}
      </h1>
      {error && (
        <p role="alert" className="text-sm text-rose-800">
          {error}
        </p>
      )}
      {pending && (
        <p className="text-sm text-content-sub">
          {checkoutInterrupted
            ? 'Trang checkout đã đóng. Nếu đã chuyển tiền, bạn có thể kiểm tra lại trạng thái tại đây.'
            : 'Trang tự kiểm tra kết quả khi hệ thống nhận xác nhận từ cổng thanh toán.'}
        </p>
      )}
      {success && (
        <p className="text-sm text-content-sub">
          Đã ghi nhận <strong>{formatCurrency(payment.amount)}</strong> vào hóa đơn.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={payment?.invoiceId ? `/invoices/my/${payment.invoiceId}` : '/invoices/my'}
          className="rounded-xl bg-gradient-emerald px-4 py-2.5 text-sm font-bold text-white"
        >
          {payment?.invoiceId ? 'Xem hóa đơn' : 'Hóa đơn của tôi'}
        </Link>
        {isDeposit && payment.contractId && (
          <Link to={`/contracts/${payment.contractId}/signing`} className="rounded-xl border border-surface-border px-4 py-2.5 text-sm font-bold text-primary-dark">
            Về hợp đồng
          </Link>
        )}
        {(pending || error || payment?.status === 'cancelled') && (
          <button
            type="button"
            className="rounded-xl border border-surface-border px-4 py-2.5 text-sm font-bold text-primary-dark"
            onClick={refresh}
          >
            Kiểm tra lại
          </button>
        )}
      </div>
    </section>
  );
}
