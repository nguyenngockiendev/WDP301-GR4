import {
  Building2,
  Wallet,
  ReceiptText,
  CircleAlert,
  Clock3,
  House,
  Zap,
  Droplets,
  ArrowUpRight,
  Info,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const number = value => Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const money = value => `${number(value)} ₫`;

export default function PropertyReport({ row, month, provisional, asOf }) {
  const empty = !row.invoiceCount && !row.paymentCount && !row.outstanding && !row.openingBalance;
  const endDate = new Date(asOf).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const otherRooms = Math.max(0, row.rooms - row.occupied - row.available);
  const occupancy = Math.min(100, Math.max(0, row.occupancyRate));
  const selectProperty = () => localStorage.setItem('currentPropertyId', row.propertyId);
  const cards = [
    {
      label: 'Phải thu trong tháng',
      value: row.invoiced,
      icon: ReceiptText,
      help: 'Tổng hóa đơn thuộc tháng chọn, bỏ hóa đơn hủy.',
      tone: 'bg-blue-50 text-blue-600',
      featured: false,
    },
    {
      label: 'Đã thu trong tháng',
      value: row.received,
      icon: Wallet,
      help: 'Tiền thanh toán thành công trong tháng, kể cả trả nợ tháng trước.',
      featured: true,
    },
    {
      label: provisional ? 'Còn nợ đến hôm nay' : `Còn nợ đến hết ngày ${endDate}`,
      value: row.outstanding,
      icon: Clock3,
      help: 'Gồm các hóa đơn chưa trả hết đến mốc báo cáo, kể cả tháng trước.',
      tone: 'bg-amber-50 text-amber-700',
      featured: false,
    },
    {
      label: 'Trong đó: nợ quá hạn',
      value: row.overdue,
      icon: CircleAlert,
      help: 'Phần còn nợ đã qua hạn thanh toán tại mốc báo cáo.',
      tone: 'bg-rose-50 text-rose-600',
      featured: false,
    },
  ];

  return (
    <article className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-primary shadow-sm">
            <Building2 size={21} />
          </span>
          <div className="min-w-0">
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-content-muted">
              Dãy trọ
            </p>
            <h2 className="break-words text-lg font-bold tracking-tight sm:text-xl">{row.name}</h2>
          </div>
        </div>
        <span className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-primary">
          Tháng {Number(month.slice(5))}/{month.slice(0, 4)}
        </span>
      </div>

      <section aria-label={`Thu tiền - ${row.name}`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-content-main">Thu tiền trong tháng</h3>
          <span className="text-xs text-content-sub">
            {provisional ? 'Tính đến hôm nay' : `Tính đến hết ngày ${endDate}`}
          </span>
        </div>
        {empty ? (
          <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-dashed border-emerald-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <span className="rounded-2xl bg-emerald-50 p-3 text-primary">
                <ReceiptText size={24} />
              </span>
              <div>
                <p className="font-semibold">
                  Tháng {Number(month.slice(5))}/{month.slice(0, 4)} chưa có hóa đơn hoặc khoản thu
                  nào.
                </p>
                <p className="mt-1 text-sm text-content-sub">
                  Bắt đầu lập hóa đơn để theo dõi tiền thu trong tháng.
                </p>
              </div>
            </div>
            <Link
              to={`/invoices/new?propertyId=${row.propertyId}&billingMonth=${month}`}
              onClick={selectProperty}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Lập hóa đơn
            </Link>
          </div>
        ) : (
          <>
            {!row.invoiceCount && (
              <p className="mb-3 text-sm text-content-sub">
                Tháng này chưa có hóa đơn mới. Các khoản bên dưới gồm thu tiền hoặc công nợ từ kỳ
                trước.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map(({ label, value, icon: Icon, help, tone, featured }) => (
                <div
                  key={label}
                  className={`relative min-w-0 rounded-2xl border p-5 transition-shadow hover:shadow-md ${featured ? 'border-emerald-700 bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/10' : 'border-slate-200/80 bg-white shadow-sm'}`}
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span
                      className={`rounded-xl p-2.5 ${featured ? 'bg-white/15 text-white' : tone}`}
                    >
                      <Icon size={20} />
                    </span>
                    {featured && (
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-semibold">
                        Đã ghi nhận
                      </span>
                    )}
                  </div>
                  <p
                    className={`min-h-10 text-sm leading-5 ${featured ? 'text-emerald-50' : 'text-content-sub'}`}
                  >
                    {label}
                  </p>
                  <p className="mt-1 break-words text-2xl font-bold tracking-tight tabular-nums">
                    {money(value)}
                  </p>
                  <details
                    className={`mt-4 border-t pt-3 text-xs ${featured ? 'border-white/20 text-emerald-50' : 'border-slate-100 text-content-sub'}`}
                  >
                    <summary
                      aria-label={`Giải thích ${label}`}
                      className="cursor-pointer list-none"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Info size={13} />
                        Cách tính
                      </span>
                    </summary>
                    <p className="mt-2 leading-5">{help}</p>
                  </details>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 text-xs text-content-sub">
              <Clock3 size={14} />
              <span>
                Nợ từ các tháng trước chuyển sang:{' '}
                <strong className="text-content-main">{money(row.openingBalance)}</strong>.
              </span>
            </div>
          </>
        )}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <section
          aria-label={`Phòng - ${row.name}`}
          className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold">
              <House size={18} className="text-primary" />
              Tình trạng phòng hiện tại
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-content-sub">
              Hôm nay
            </span>
          </div>
          <div className="my-6 flex flex-wrap items-center justify-center gap-6 sm:justify-start">
            <div
              role="img"
              aria-label={`Tỷ lệ lấp đầy ${number(row.occupancyRate)}%`}
              className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full p-3"
              style={{
                background: `conic-gradient(#059669 0% ${occupancy}%, #f1f5f9 ${occupancy}% 100%)`,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                <span className="text-3xl font-bold tracking-tight">
                  {number(row.occupancyRate)}%
                </span>
                <span className="mt-1 text-[11px] text-content-sub">Tỷ lệ lấp đầy</span>
              </div>
            </div>
            <dl className="min-w-[140px] flex-1 space-y-3 text-sm">
              {[
                ['bg-emerald-500', 'Phòng đang thuê', row.occupied],
                ['bg-slate-300', 'Phòng trống', row.available],
                ['bg-amber-400', 'Bảo trì / giữ chỗ', otherRooms],
              ].map(([color, label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-content-sub">
                    <span className={`h-2 w-2 rounded-full ${color}`} />
                    {label}
                  </dt>
                  <dd className="font-bold tabular-nums">{number(value)}</dd>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-100 pt-3">
                <dt className="font-semibold">Tổng số phòng</dt>
                <dd className="font-bold">{number(row.rooms)}</dd>
              </div>
            </dl>
          </div>
          <p className="border-t border-slate-100 pt-3 text-xs leading-5 text-content-sub">
            Phòng bảo trì hoặc giữ chỗ vẫn thuộc tổng số phòng, không tính là phòng trống hay đang
            thuê.
          </p>
        </section>

        <section
          aria-label={`Điện nước - ${row.name}`}
          className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">Điện nước trong tháng</h3>
            <Link
              to={`/utility-readings?billingMonth=${month}`}
              onClick={selectProperty}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              Ghi số điện nước
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: 'Điện',
                total: row.electricityTotal,
                average: row.electricityAverage,
                count: row.electricityRooms,
                unit: 'kWh',
                icon: Zap,
                tone: 'border-amber-100 bg-amber-50/60',
                iconTone: 'bg-amber-100 text-amber-700',
              },
              {
                label: 'Nước',
                total: row.waterTotal,
                average: row.waterAverage,
                count: row.waterRooms,
                unit: 'm³',
                icon: Droplets,
                tone: 'border-sky-100 bg-sky-50/70',
                iconTone: 'bg-sky-100 text-sky-700',
              },
            ].map(({ label, total, average, count, unit, icon: Icon, tone, iconTone }) => (
              <div key={label} className={`min-w-0 rounded-2xl border p-4 ${tone}`}>
                <div className="mb-4 flex items-center gap-2">
                  <span className={`rounded-lg p-2 ${iconTone}`}>
                    <Icon size={17} />
                  </span>
                  <h4 className="text-sm font-bold">{label}</h4>
                </div>
                {count ? (
                  <>
                    <p className="break-words text-2xl font-bold tracking-tight">
                      {number(total)}{' '}
                      <span className="text-sm font-medium text-content-sub">{unit}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-content-sub">Tổng tiêu thụ</p>
                    <div className="mt-4 border-t border-white pt-3">
                      <p className="text-xs text-content-sub">Trung bình mỗi phòng</p>
                      <p className="mt-1 text-sm font-bold">
                        {number(average)} {unit}/phòng
                      </p>
                      <p className="mt-2 text-[11px] leading-4 text-content-sub">
                        Tính trên {count}/{row.rooms} phòng đã ghi số.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm leading-6 text-content-sub">
                    Tháng này chưa có số {label.toLowerCase()} để tính.
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-content-sub">
            Chỉ tính trung bình trên phòng đã ghi số; phòng chưa ghi số không được coi là dùng 0.
          </p>
        </section>
      </div>
    </article>
  );
}
