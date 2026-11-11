import { ArrowRight, ReceiptText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

export function canSendInvoice(invoice) {
  return !invoice.sentAt && invoice.status !== 'cancelled';
}

export function InvoiceSendBadge({ invoice }) {
  if (invoice.status === 'cancelled') {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Đã hủy</span>;
  }
  return invoice.sentAt ? (
    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Đã gửi</span>
  ) : (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Chưa gửi</span>
  );
}

export default function ManagedInvoiceList({ invoices, canSend, selectedIds, toggleInvoice, toggleAll, filters }) {
  if (!invoices.length) {
    return (
      <section className="rounded-3xl border border-white bg-white/90 p-8 text-center shadow-card">
        <ReceiptText size={28} className="mx-auto mb-3 text-primary" />
        <p className="font-bold text-content-main">Không có hóa đơn theo bộ lọc này</p>
      </section>
    );
  }

  const sendableInvoices = invoices.filter(canSendInvoice);
  const allSelected = sendableInvoices.length > 0 && sendableInvoices.every(invoice => selectedIds.includes(invoice._id));

  return (
    <div className="overflow-x-auto rounded-3xl border border-white bg-white/90 shadow-card">
      <table className="w-full min-w-[690px] text-left text-sm">
        <thead className="bg-slate-50 text-content-sub">
          <tr>
            {canSend && (
              <th scope="col" className="px-4 py-3">
                <label className="inline-flex items-center gap-2 whitespace-nowrap">
                  <input type="checkbox" aria-label="Chọn tất cả hóa đơn chưa gửi đang hiển thị" checked={allSelected} disabled={!sendableInvoices.length} onChange={toggleAll} className="size-4 accent-primary" />
                  Tất cả
                </label>
              </th>
            )}
            <th scope="col" className="px-4 py-3">Phòng / Người đứng tên</th>
            <th scope="col" className="px-4 py-3">Tổng tiền</th>
            <th scope="col" className="px-4 py-3">Hạn thanh toán</th>
            <th scope="col" className="px-4 py-3">Trạng thái gửi</th>
            <th scope="col" className="px-4 py-3">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(invoice => {
            const roomNumber = invoice.contract?.room?.roomNumber || '—';
            const selected = selectedIds.includes(invoice._id);
            return (
              <tr key={invoice._id} className={`border-t border-surface-border ${selected ? 'bg-primary-50' : ''}`}>
                {canSend && (
                  <td className="px-4 py-3">
                    <input type="checkbox" aria-label={`Chọn hóa đơn phòng ${roomNumber}`} checked={selected} disabled={!canSendInvoice(invoice)} onChange={() => toggleInvoice(invoice._id)} className="size-4 accent-primary disabled:opacity-40" />
                  </td>
                )}
                <th scope="row" className="px-4 py-3 font-bold text-content-main">
                  Phòng {roomNumber}
                  <span className="block font-normal text-content-sub">{invoice.billedToName || 'Chưa xác định'}</span>
                </th>
                <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-content-main">{formatCurrency(invoice.totalAmount)}</td>
                <td className="px-4 py-3 text-content-sub">{formatDate(invoice.dueDate)}</td>
                <td className="whitespace-nowrap px-4 py-3"><InvoiceSendBadge invoice={invoice} /></td>
                <td className="px-4 py-3">
                  <Link to={`/invoices/${invoice._id}?${filters}`} className="inline-flex items-center gap-1 whitespace-nowrap font-bold text-primary-dark hover:underline">
                    Chi tiết <ArrowRight size={15} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
