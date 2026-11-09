import { Eye } from 'lucide-react';

const inputClass =
  'mt-1.5 w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-slate-50';

export default function InvoiceSelectionForm({
  properties, propertyId, billingMonth, contract, availableContracts,
  loadingProperties, loadingContracts, validMonth, busy, previewing, createdInvoice,
  selectProperty, selectMonth, selectContract, previewInvoice,
}) {
  const canPreview = contract && validMonth && !loadingProperties && !loadingContracts && !busy && !createdInvoice;

  return (
    <form
      className="rounded-3xl border border-white bg-white/90 p-4 shadow-card sm:p-6"
      onSubmit={event => { event.preventDefault(); previewInvoice(); }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-bold text-content-main">
          Nhà trọ
          <select
            className={inputClass} value={propertyId}
            disabled={busy || loadingProperties || !properties.length}
            onChange={event => selectProperty(event.target.value)}
          >
            <option value="" disabled>{loadingProperties ? 'Đang tải nhà trọ…' : 'Chọn nhà trọ'}</option>
            {properties.map(property => <option key={property._id} value={property._id}>{property.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-content-main">
          Kỳ hóa đơn
          <input
            type="month" className={inputClass} value={billingMonth} required disabled={busy}
            onChange={event => selectMonth(event.target.value)}
          />
        </label>
        <label className="text-sm font-bold text-content-main">
          Phòng và hợp đồng
          <select
            className={inputClass} value={contract?._id || ''}
            disabled={busy || loadingContracts || !availableContracts.length}
            onChange={event => selectContract(event.target.value)}
          >
            <option value="" disabled>{loadingContracts ? 'Đang tải hợp đồng…' : 'Chọn hợp đồng'}</option>
            {availableContracts.map(item => (
              <option key={item._id} value={item._id}>
                {item.room?.roomNumber ? `Phòng ${item.room.roomNumber}` : 'Hợp đồng'}
                {' · '}
                {item.representative?.fullName || item._id.slice(-6)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="submit" disabled={!canPreview}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-emerald px-4 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Eye size={16} /> {previewing ? 'Đang tính…' : 'Xem trước hóa đơn'}
        </button>
      </div>
    </form>
  );
}
