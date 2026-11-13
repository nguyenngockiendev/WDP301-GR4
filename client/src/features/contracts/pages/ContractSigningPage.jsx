import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { btnGhost } from '../../../shared/components/Modal';
import { getCurrentUser } from '../../../shared/utils/auth';
import contractsAPI from '../api/contracts-api';
import SignaturePad from '../components/SignaturePad';
import ContractDocumentView from '../components/ContractDocumentView';
import { signingLabels } from '../signingLabels';
import { formatCurrency } from '../../../shared/utils/format';
import InvoicePaymentButton from '../../invoices/components/InvoicePaymentButton';
import useInvoicePayment from '../../invoices/hooks/useInvoicePayment';

export default function ContractSigningPage() {
  const { contractId } = useParams();
  const role = getCurrentUser()?.role;
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const inProgress = useRef(false);
  const { payInvoice, payingInvoiceId, paymentError } = useInvoicePayment();

  useEffect(() => {
    let current = true;
    setDocument(null);
    setError('');
    setRejecting(false);
    setReason('');
    contractsAPI.getSigningDocument(contractId)
      .then(response => { if (current) setDocument(response.data); })
      .catch(error => {
        if (current) setError(error.response?.data?.message || 'Không tải được hợp đồng.');
      });
    return () => { current = false; };
  }, [contractId]);

  async function submit(action, data = {}) {
    if (inProgress.current) return;
    inProgress.current = true;
    setBusy(true);
    try {
      await contractsAPI.changeSigning(contractId, action, { revision: document.signing.revision, ...data });
      const response = await contractsAPI.getSigningDocument(contractId);
      setDocument(response.data);
      setRejecting(false);
      setReason('');
      toast.success('Đã cập nhật hợp đồng');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không cập nhật được hợp đồng. Vui lòng tải lại để kiểm tra.');
    } finally {
      inProgress.current = false;
      setBusy(false);
    }
  }

  if (error) return <p role="alert" className="p-6 text-rose-700">{error}</p>;
  if (!document) return <p role="status" className="p-6">Đang tải hợp đồng…</p>;

  const signing = document.signing;
  const deposit = document.depositInvoice;
  const isWaitingForActivation = signing.status === 'signed' && document.status === 'draft' &&
    (!deposit || deposit.status === 'paid');
  const tenantCanSign = role === 'tenant' && signing.status === 'awaiting_tenant';
  const managerCanSign = role === 'manager' && signing.status === 'awaiting_manager';
  const canWithdraw = role === 'manager' && ['awaiting_tenant', 'awaiting_manager'].includes(signing.status);
  const signatures = [
    ['Khách thuê', signing.tenantSignature],
    ['Quản lý', signing.managerSignature],
  ];

  return (
    <section className="mx-auto max-w-4xl space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
      <Link to={role === 'tenant' ? '/contracts/my' : '/contracts'} className="text-sm font-semibold text-emerald-700">Về danh sách hợp đồng</Link>
      <h1 className="text-2xl font-black text-slate-900">{signing.title}</h1>
      <p className="font-semibold text-emerald-700">{signingLabels[signing.status]}</p>
      {isWaitingForActivation && (
        <p className="text-sm text-slate-600">
          Chờ hiệu lực · Ngày bắt đầu thuê {new Date(document.startDate).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
        </p>
      )}
      {signing.status === 'signed' && document.status === 'active' && (
        <p className="text-sm text-emerald-700">Hợp đồng đang có hiệu lực.</p>
      )}
      {deposit && (
        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="font-bold">Tiền đặt cọc · {formatCurrency(deposit.totalAmount)}</h2>
          <p className="text-sm">{deposit.status === 'paid' ? 'Đã đóng cọc' : deposit.status === 'cancelled' ? 'Khoản cọc đã hủy' : 'Chờ đóng cọc'}</p>
          <InvoicePaymentButton invoice={deposit} payingInvoiceId={payingInvoiceId} onPay={payInvoice} />
          {paymentError && <p role="alert" className="text-sm text-rose-700">{paymentError}</p>}
        </div>
      )}
      {signing.rejectionReason && <p className="text-sm text-rose-700">Lý do từ chối — {signing.rejectionReason}</p>}
      <article><ContractDocumentView content={signing.document} /></article>
      <div className="grid gap-3 sm:grid-cols-2">
        {signatures.map(([label, signature]) => signature && (
          <div key={label} className="rounded-xl border p-3">
            <strong className="text-sm">Chữ ký {label.toLowerCase()}</strong>
            <img src={signature.image} alt={`Chữ ký ${label.toLowerCase()}`} className="block w-full" />
            <p className="text-xs text-slate-600">{new Date(signature.signedAt).toLocaleString('vi-VN')}</p>
          </div>
        ))}
      </div>
      {role === 'tenant' && signing.status === 'signed' && document.status === 'active' && (
        <div className="flex justify-end">
          <Link to={`/checkout-requests/new?contractId=${contractId}`} className={btnGhost}>
            Yêu cầu trả phòng
          </Link>
        </div>
      )}
      {(tenantCanSign || managerCanSign) && !rejecting && (
        <SignaturePad key={`${signing.revision}:${signing.status}`} disabled={busy}
          onSign={image => submit(tenantCanSign ? 'tenant-sign' : 'manager-sign', { image })} />
      )}
      {tenantCanSign && (rejecting ? (
        <form className="space-y-2" onSubmit={event => { event.preventDefault(); submit('reject', { reason }); }}>
          <label className="block text-sm font-semibold" htmlFor="signing-reason">Lý do từ chối</label>
          <textarea id="signing-reason" value={reason} onChange={event => setReason(event.target.value)}
            maxLength={500} required className="block w-full rounded-lg border p-2" />
          <button type="submit" disabled={busy || !reason.trim()} className="mr-3 text-sm font-bold text-rose-700 disabled:opacity-50">Xác nhận từ chối</button>
          <button type="button" disabled={busy} onClick={() => setRejecting(false)} className="text-sm text-slate-600">Quay lại</button>
        </form>
      ) : (
        <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="text-sm font-semibold text-rose-700">Từ chối hợp đồng</button>
      ))}
      {canWithdraw && (
        <button type="button" disabled={busy} className="text-sm font-semibold text-rose-700"
          onClick={() => { if (window.confirm('Thu hồi bản này? Khách thuê sẽ phải xem và ký lại khi bạn gửi bản mới.')) submit('withdraw'); }}>
          Thu hồi bản đang chờ ký
        </button>
      )}
    </section>
  );
}
