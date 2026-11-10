export default function RevenueChart({ revenue }) {
  const maximum = Math.max(1, ...revenue.map(item => item.amount));
  const points = revenue
    .map((item, index) => `${55 + index * 92},${155 - (item.amount / maximum) * 125}`)
    .join(' ');
  const hasPayments = revenue.some(item => item.count > 0);
  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between h-full min-h-80">
      <div className="flex flex-wrap justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">Biểu Đồ Doanh Thu Thực Thu</h3>
          <p className="text-[11px] font-medium text-slate-400 mt-1">
            6 tháng gần nhất · VND · Tháng hiện tại tính đến hôm nay
          </p>
        </div>
        <span className="text-xs font-bold text-emerald-700">● Giao dịch thành công</span>
      </div>
      {!hasPayments && (
        <p className="text-sm text-slate-500">Chưa có giao dịch thành công trong 6 tháng này.</p>
      )}
      <svg
        viewBox="0 0 560 200"
        className="w-full h-56"
        role="img"
        aria-label="Thực thu theo tháng"
      >
        <defs>
          <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#059669" stopOpacity=".25" />
            <stop offset="1" stopColor="#059669" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 90, 155].map(y => (
          <line key={y} x1="55" x2="515" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 4" />
        ))}
        <polygon points={`55,155 ${points} 515,155`} fill="url(#dashboardRevenueFill)" />
        <polyline points={points} fill="none" stroke="#059669" strokeWidth="3" />
        {revenue.map((item, index) => (
          <g key={item.month}>
            <circle
              cx={55 + index * 92}
              cy={155 - (item.amount / maximum) * 125}
              r="4"
              fill="#059669"
            >
              <title>
                {item.month}: {item.amount.toLocaleString('vi-VN')} ₫
              </title>
            </circle>
            <text x={55 + index * 92} y="180" textAnchor="middle" fontSize="10" fill="#64748b">
              {item.month}
            </text>
            <text
              x={55 + index * 92}
              y={Math.max(15, 145 - (item.amount / maximum) * 125)}
              textAnchor="middle"
              fontSize="9"
              fill="#065f46"
            >
              {item.amount.toLocaleString('vi-VN')}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-[11px] text-slate-400">
        Chưa trừ hoàn tiền; không phải lợi nhuận. Chưa có dữ liệu mục tiêu doanh thu để so sánh.
      </p>
    </div>
  );
}
