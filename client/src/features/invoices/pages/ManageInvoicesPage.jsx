import { useState } from 'react';
import { ArrowLeft, Plus, Send } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Modal, { btnGhost, btnPrimary, inputCls } from '../../../shared/components/Modal';
import { formatCurrency } from '../../../shared/utils/format';
import { getCurrentUser } from '../../../shared/utils/auth';
import { sendInvoicesAPI } from '../api/invoices-api';
import InvoiceDetail from '../components/InvoiceDetail';
import ManagedInvoiceList, { canSendInvoice, InvoiceSendBadge } from '../components/ManagedInvoiceList';
import useManagedInvoices from '../hooks/useManagedInvoices';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ManageInvoiceScreen({ invoiceId }) {
  const canSend = getCurrentUser()?.role === 'manager';
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmation, setConfirmation] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const billingMonth = searchParams.get('billingMonth') ?? currentMonth();
  const sendStatus = searchParams.get('sendStatus') || 'all';
  const { properties, propertyId, data, loadingProperties, loading, error, reload } = useManagedInvoices({
    invoiceId,
    requestedPropertyId: searchParams.get('propertyId'),
    billingMonth,
    sendStatus,
  });

  const filters = new URLSearchParams({
    propertyId: propertyId || searchParams.get('propertyId') || data?.contract?.room?.property?._id || '',
    billingMonth: invoiceId && !searchParams.has('billingMonth') && data?.invoiceType !== 'deposit'
      ? data?.billingMonth || billingMonth : billingMonth,
    sendStatus,
  });
  const invoices = !invoiceId && data ? data : [];
  const sendableInvoices = invoices.filter(canSendInvoice);
  const selectedInvoices = sendableInvoices.filter(invoice => selectedIds.includes(invoice._id));

  function changeFilter(name, value) {
    filters.set(name, value);
    setSelectedIds([]);
    setSendMessage('');
    setSearchParams(filters, { replace: true });
  }

  function toggleInvoice(id) {
    setSelectedIds(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]);
  }

  function toggleAll() {
    setSelectedIds(selectedInvoices.length === sendableInvoices.length ? [] : sendableInvoices.map(invoice => invoice._id));
  }

  function askToSend(invoicesToSend) {
    setSendError('');
    setSendMessage('');
    setConfirmation(invoicesToSend);
  }

  async function confirmSend() {
    if (sending || !confirmation.length) return;
    setSending(true);
    setSendError('');
    try {
      const response = await sendInvoicesAPI(confirmation.map(invoice => invoice._id));
      if (!response?.success) {
        setSendError(response?.message || 'Không gửi được hóa đơn.');
        return;
      }
      setSendMessage(response.message);
      setConfirmation([]);
      setSelectedIds([]);
      reload();
    } catch (error) {
      setSendError(error.response?.data?.message || 'Không gửi được hóa đơn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary-dark">Dịch vụ &amp; tài chính</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-content-main sm:text-3xl">
            {invoiceId ? 'Chi tiết hóa đơn' : 'Quản lý hóa đơn'}
          </h1>
          <p className="mt-1 text-sm text-content-sub">{canSend ? 'Xem hóa đơn đã lập và gửi cho người thuê đứng tên.' : 'Xem hóa đơn đã lập và trạng thái gửi.'}</p>
        </div>
        {invoiceId ? (
          <Link to={`/invoices?${filters}`} className={btnGhost}><ArrowLeft size={15} className="mr-1 inline" /> Danh sách hóa đơn</Link>
        ) : (
          <Link to={`/invoices/new?${filters}`} className={btnPrimary}><Plus size={15} className="mr-1 inline" /> Lập hóa đơn</Link>
        )}
      </div>

      {!invoiceId && (
        <section className="space-y-4 rounded-3xl border border-white bg-white/90 p-4 shadow-card sm:p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-bold text-content-main">
              Nhà trọ
              <select className={`${inputCls} mt-1`} value={propertyId} disabled={!properties.length} onChange={event => changeFilter('propertyId', event.target.value)}>
                {!properties.length && <option value="">{loadingProperties ? 'Đang tải nhà trọ…' : 'Chưa có nhà trọ'}</option>}
                {properties.map(property => <option key={property._id} value={property._id}>{property.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-bold text-content-main">
              Kỳ hóa đơn
              <input className={`${inputCls} mt-1`} type="month" value={billingMonth} onChange={event => changeFilter('billingMonth', event.target.value)} />
            </label>
            <label className="text-sm font-bold text-content-main">
              Trạng thái gửi
              <select className={`${inputCls} mt-1`} value={sendStatus} onChange={event => changeFilter('sendStatus', event.target.value)}>
                <option value="all">Tất cả</option>
                <option value="unsent">Chưa gửi</option>
                <option value="sent">Đã gửi</option>
              </select>
            </label>
          </div>
          {canSend && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-content-sub" aria-live="polite">Đã chọn {selectedInvoices.length} hóa đơn</p>
              <button type="button" className={btnPrimary} disabled={!selectedInvoices.length} onClick={() => askToSend(selectedInvoices)}>
                <Send size={15} className="mr-1 inline" /> Gửi {selectedInvoices.length || ''} hóa đơn đã chọn
              </button>
            </div>
          )}
        </section>
      )}

      {(loadingProperties || loading) && <p role="status" className="rounded-xl bg-white p-4 text-sm text-content-sub">Đang tải hóa đơn…</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {sendMessage && <p role="status" className="rounded-xl bg-primary-50 p-4 text-sm font-bold text-primary-dark">{sendMessage}</p>}

      {!invoiceId && data && (
        <ManagedInvoiceList invoices={invoices} canSend={canSend} selectedIds={selectedInvoices.map(invoice => invoice._id)} toggleInvoice={toggleInvoice} toggleAll={toggleAll} filters={filters} />
      )}
      {invoiceId && data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-card">
            <InvoiceSendBadge invoice={data} />
            {canSend && canSendInvoice(data) && <button type="button" className={btnPrimary} onClick={() => askToSend([data])}><Send size={15} className="mr-1 inline" /> Gửi cho người thuê</button>}
          </div>
          <InvoiceDetail invoice={data} />
        </>
      )}

      {confirmation.length > 0 && (
        <Modal
          title={`Gửi ${confirmation.length} hóa đơn cho người thuê?`}
          onClose={() => setConfirmation([])}
          disabled={sending}
          footer={(
            <>
              <button type="button" className={btnGhost} disabled={sending} onClick={() => setConfirmation([])}>Quay lại</button>
              <button type="button" className={btnPrimary} disabled={sending} onClick={confirmSend}>{sending ? 'Đang gửi…' : 'Xác nhận gửi'}</button>
            </>
          )}
        >
          <p className="text-sm text-content-sub">Hóa đơn sẽ xuất hiện trong mục Hóa đơn của tôi của người đứng tên.</p>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto rounded-xl bg-surface-bg p-3 text-sm">
            {confirmation.map(invoice => (
              <li key={invoice._id} className="flex flex-wrap justify-between gap-1">
                <span>Phòng {invoice.contract?.room?.roomNumber || '—'} · {invoice.billedToName || 'Chưa xác định'}</span>
                <strong>{formatCurrency(invoice.totalAmount)}</strong>
              </li>
            ))}
          </ul>
          {sendError && <p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{sendError}</p>}
        </Modal>
      )}
    </div>
  );
}

export default function ManageInvoicesPage() {
  const { invoiceId } = useParams();
  return <ManageInvoiceScreen key={invoiceId || 'list'} invoiceId={invoiceId} />;
}
