const statuses = {
  unpaid: ['Chưa thanh toán', 'bg-amber-100 text-amber-900'],
  partially_paid: ['Đã trả một phần', 'bg-sky-100 text-sky-900'],
  paid: ['Đã thanh toán', 'bg-emerald-100 text-emerald-900'],
  overdue: ['Quá hạn', 'bg-rose-100 text-rose-900'],
  cancelled: ['Đã hủy', 'bg-slate-100 text-slate-700'],
};

export default function InvoiceStatusBadge({ status }) {
  const [label, color] = statuses[status] || ['Chưa xác định', 'bg-slate-100 text-slate-700'];
  return <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${color}`}>{label}</span>;
}
