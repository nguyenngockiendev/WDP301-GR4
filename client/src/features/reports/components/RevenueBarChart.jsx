const compactMoney = value => {
  if (value >= 1e9) return `${(value / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tỷ`;
  if (value >= 1e6) return `${(value / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`;
  if (value >= 1e3) return `${(value / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 0 })} k`;
  return value.toLocaleString('vi-VN');
};

// Biểu đồ cột doanh thu (hóa đơn đã thanh toán) 12 tháng trong năm, làm nổi tháng đang xem.
export default function RevenueBarChart({ data, selectedMonth, onSelectMonth }) {
  const maximum = Math.max(1, ...data.map(item => item.amount));
  const hasRevenue = data.some(item => item.amount > 0);
  const ticks = [1, 0.5, 0];

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-semibold">Doanh thu các tháng năm {selectedMonth.slice(0, 4)}</h4>
        <span className="text-xs text-content-sub">Hóa đơn đã thanh toán · VND</span>
      </div>
      {!hasRevenue && (
        <p className="mt-2 text-sm text-content-sub">Năm này chưa có hóa đơn nào được thanh toán.</p>
      )}
      <div className="mt-4 flex gap-2">
        <div className="relative w-12 shrink-0 text-right text-[10px] text-content-sub" aria-hidden>
          {ticks.map(tick => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2"
              style={{ top: `${(1 - tick) * 100}%` }}
            >
              {compactMoney(Math.round(maximum * tick))}
            </span>
          ))}
        </div>
        <div className="relative h-48 flex-1">
          {ticks.map(tick => (
            <div
              key={tick}
              className="absolute inset-x-0 border-t border-dashed border-slate-200"
              style={{ top: `${(1 - tick) * 100}%` }}
            />
          ))}
          <div className="relative flex h-full items-end gap-1 sm:gap-2" role="list">
            {data.map(item => {
              const selected = item.month === selectedMonth;
              const height = item.amount ? Math.max(2, (item.amount / maximum) * 100) : 0;
              return (
                <button
                  type="button"
                  role="listitem"
                  key={item.month}
                  onClick={() => onSelectMonth?.(item.month)}
                  title={`Tháng ${Number(item.month.slice(5))}: ${item.amount.toLocaleString('vi-VN')} ₫ (${item.count} hóa đơn)`}
                  aria-label={`Tháng ${Number(item.month.slice(5))}: ${item.amount.toLocaleString('vi-VN')} đồng`}
                  className="group relative flex h-full flex-1 items-end justify-center"
                >
                  {item.amount > 0 && (
                    <span
                      className={`absolute z-10 whitespace-nowrap text-[10px] font-semibold ${
                        selected ? 'text-primary' : 'hidden text-content-sub group-hover:block'
                      }`}
                      style={{ bottom: `calc(${height}% + 4px)` }}
                    >
                      {compactMoney(item.amount)}
                    </span>
                  )}
                  <span
                    className={`w-full max-w-10 rounded-t-md transition-colors ${
                      selected ? 'bg-primary' : 'bg-primary/25 group-hover:bg-primary/50'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-14 mt-2 flex gap-1 sm:gap-2" aria-hidden>
        {data.map(item => (
          <span
            key={item.month}
            className={`flex-1 text-center text-[10px] sm:text-xs ${
              item.month === selectedMonth ? 'font-bold text-primary' : 'text-content-sub'
            }`}
          >
            T{Number(item.month.slice(5))}
          </span>
        ))}
      </div>
    </div>
  );
}
