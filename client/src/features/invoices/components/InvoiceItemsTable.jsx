import { formatCurrency } from '../../../shared/utils/format';

const itemLabels = {
  rent: 'Tiền phòng',
  electricity: 'Tiền điện',
  water: 'Tiền nước',
  service: 'Phí dịch vụ',
  other: 'Khoản phát sinh',
};

export default function InvoiceItemsTable({ items = [] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-border">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-slate-50 text-content-sub">
          <tr>
            <th scope="col" className="px-4 py-3">Khoản thu</th>
            <th scope="col" className="px-4 py-3">Diễn giải</th>
            <th scope="col" className="px-4 py-3 text-right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-t border-surface-border">
              <th scope="row" className="px-4 py-3 font-bold text-content-main">{itemLabels[item.type] || 'Khoản khác'}</th>
              <td className="px-4 py-3 text-content-sub">
                {item.description || '—'}
                {Number.isFinite(item.quantity) && Number.isFinite(item.unitPrice) && (
                  <span className="block text-xs">{item.quantity} × {formatCurrency(item.unitPrice)}</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-extrabold tabular-nums">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
          {!items.length && <tr><td colSpan={3} className="px-4 py-3 text-content-sub">Chưa có khoản thu chi tiết.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
