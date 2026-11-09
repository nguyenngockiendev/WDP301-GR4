import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ReceiptText } from 'lucide-react';
import InvoiceSelectionForm from '../components/InvoiceSelectionForm';
import InvoicePreview from '../components/InvoicePreview';
import useCreateInvoice from '../hooks/useCreateInvoice';

export default function CreateInvoicePage() {
  const [searchParams] = useSearchParams();
  const invoiceForm = useCreateInvoice({
    initialPropertyId: searchParams.get('propertyId') || '',
    initialRoomId: searchParams.get('roomId') || '',
    initialBillingMonth: searchParams.get('billingMonth') || '',
  });
  const {
    property, contract, properties, billingMonth, validMonth, availableContracts,
    loadingProperties, loadingContracts, loadError, selectionWarning, preferredRoomUnavailable,
    preview, createdInvoice, previewing, creating, createInvoice, invoiceError, busy,
  } = invoiceForm;
  const invoice = createdInvoice || preview;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-content-sub">Dịch vụ &amp; tài chính / <span className="text-primary-dark">Hóa đơn</span></p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-content-main sm:text-3xl">Lập hóa đơn</h1>
          <p className="mt-1 text-sm text-content-sub">Chọn hợp đồng và kỳ, kiểm tra từng khoản trước khi tạo hóa đơn.</p>
        </div>
        <Link to="/utility-readings" className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2 text-sm font-bold text-content-sub hover:text-primary-dark">
          <ArrowLeft size={16} /> Ghi chỉ số điện nước
        </Link>
      </div>

      <InvoiceSelectionForm {...invoiceForm} />

      {(loadError || invoiceError) && (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{loadError || invoiceError}</p>
      )}
      {selectionWarning && <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{selectionWarning}</p>}
      {!loadingProperties && !loadError && !properties.length && (
        <p className="rounded-xl bg-white p-4 text-sm text-content-sub">Bạn chưa có nhà trọ được phép quản lý.</p>
      )}
      {!loadError && property && validMonth && !loadingContracts && !availableContracts.length && (
        <p className="rounded-xl bg-white p-4 text-sm text-content-sub">Nhà trọ chưa có hợp đồng phù hợp với kỳ này.</p>
      )}
      {!loadError && preferredRoomUnavailable && availableContracts.length > 0 && (
        <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Phòng trong liên kết chưa có hợp đồng phù hợp với kỳ này.</p>
      )}

      {invoice ? (
        <InvoicePreview
          invoice={invoice} contract={contract} property={property} billingMonth={billingMonth}
          created={Boolean(createdInvoice)} busy={busy} creating={creating} createInvoice={createInvoice}
        />
      ) : (
        <section className="rounded-3xl border border-white bg-white/85 p-8 text-center shadow-card">
          <ReceiptText size={26} className="mx-auto mb-3 text-primary" />
          <p role="status" className="text-sm font-bold text-content-main">{previewing ? 'Đang tính hóa đơn…' : 'Chưa có hóa đơn xem trước'}</p>
          {!previewing && <p className="mt-1 text-sm text-content-sub">Các khoản tiền phòng, điện nước, dịch vụ và phát sinh sẽ hiển thị tại đây.</p>}
        </section>
      )}
    </div>
  );
}
