import RevenueBarChart from './RevenueBarChart';

const number = value => Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const money = value => `${number(value)} ₫`;
const statusLabels = {
  available: ['Sẵn sàng cho thuê', 'bg-emerald-50 text-emerald-700'],
  occupied: ['Đã có người thuê', 'bg-sky-50 text-sky-700'],
  maintenance: ['Đang bảo trì', 'bg-amber-50 text-amber-700'],
  reserved: ['Đang giữ chỗ', 'bg-violet-50 text-violet-700'],
};

// Tổng quan tháng của một dãy trọ: phòng trống / đang thuê, tỉ lệ lấp đầy, doanh thu.
export default function MonthlyOverview({ row, month, provisional, onSelectMonth }) {
  const monthly = row.monthly;
  if (!monthly) return null;
  const monthLabel = `${Number(month.slice(5))}/${month.slice(0, 4)}`;
  const cards = [
    ['Tổng số phòng', number(monthly.totalRooms), 'text-content-main'],
    ['Phòng đang cho thuê', number(monthly.rentedRooms), 'text-sky-700'],
    ['Phòng trống', number(monthly.vacantRooms), 'text-amber-600'],
  ];

  return (
    <section aria-label={`Tổng quan tháng - ${row.name}`} className="space-y-4">
      <div>
        <h3 className="font-bold">Tổng quan tháng {monthLabel}</h3>
        <p className="mt-1 text-sm text-content-sub">
          Phòng đang cho thuê là phòng có hợp đồng hiệu lực trong tháng
          {provisional ? ' (tính đến hôm nay)' : ''}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-surface-border bg-white p-4">
            <p className="text-sm text-content-sub">{label}</p>
            <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
        <div className="rounded-xl border border-surface-border bg-white p-4">
          <p className="text-sm text-content-sub">Tỉ lệ lấp đầy</p>
          <p className="mt-2 text-2xl font-bold text-primary">{number(monthly.occupancyRate)}%</p>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-valuenow={monthly.occupancyRate}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, monthly.occupancyRate)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-primary/5 p-5">
          <div>
            <p className="text-sm text-content-sub">Doanh thu tháng {monthLabel}</p>
            <p className="mt-2 text-3xl font-bold text-primary">{money(monthly.revenue)}</p>
            <p className="mt-2 text-sm text-content-sub">
              Từ {number(monthly.paidInvoiceCount)} hóa đơn kỳ {monthLabel} đã thanh toán đủ.
            </p>
          </div>
          <div className="border-t border-primary/10 pt-3 text-sm">
            <p className="text-content-sub">Cả năm {month.slice(0, 4)}</p>
            <p className="mt-1 text-lg font-semibold">{money(monthly.yearRevenue)}</p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <RevenueBarChart
            data={monthly.revenueByMonth}
            selectedMonth={month}
            onSelectMonth={onSelectMonth}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-surface-border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-border p-4">
          <h4 className="font-semibold">Phòng còn trống trong tháng {monthLabel}</h4>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {number(monthly.vacantRooms)} phòng
          </span>
        </div>
        {monthly.vacantRoomList.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-content-sub">
                <tr>
                  <th className="px-4 py-3 font-semibold">Phòng</th>
                  <th className="px-4 py-3 font-semibold">Tầng</th>
                  <th className="px-4 py-3 text-right font-semibold">Diện tích</th>
                  <th className="px-4 py-3 text-right font-semibold">Giá thuê</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {monthly.vacantRoomList.map(room => {
                  const [label, style] = statusLabels[room.currentStatus] || [
                    room.currentStatus,
                    'bg-slate-100 text-slate-600',
                  ];
                  return (
                    <tr key={room._id} className="border-t border-surface-border">
                      <td className="px-4 py-3 font-semibold">
                        {room.roomNumber}
                        {room.name && (
                          <span className="ml-2 font-normal text-content-sub">{room.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{room.floor ?? '—'}</td>
                      <td className="px-4 py-3 text-right">{number(room.area)} m²</td>
                      <td className="px-4 py-3 text-right font-medium">{money(room.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-4 text-sm text-content-sub">
            {monthly.totalRooms
              ? 'Tất cả phòng đều đang cho thuê trong tháng này.'
              : 'Dãy trọ chưa có phòng nào trong tháng này.'}
          </p>
        )}
      </div>
    </section>
  );
}
