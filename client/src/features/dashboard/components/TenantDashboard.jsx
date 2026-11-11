import { ArrowRight, Building2, CalendarClock, Check, ClipboardList, House, ReceiptText, RotateCw, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../../../shared/utils/format';

const panel = 'rounded-2xl border border-surface-border bg-white p-5 shadow-card sm:p-6';
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const paymentLabels = {
  cash: 'Tiền mặt',
  deposit: 'Cấn trừ tiền cọc',
  gateway: 'Thanh toán trực tuyến',
  transfer: 'Chuyển khoản',
};

function invoiceLabel(invoice) {
  if (invoice.invoiceType === 'deposit') return 'Tiền đặt cọc';
  if (['checkout_asset', 'checkout_payment'].includes(invoice.invoiceType)) return 'Quyết toán trả phòng';
  const [year, month] = (invoice.billingMonth || '').split('-');
  return month ? `Hóa đơn tháng ${month}/${year}` : 'Hóa đơn thuê phòng';
}

function DashboardStat({ icon: Icon, label, value }) {
  return (
    <div className={`${panel} flex items-center gap-3`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-dark">
        <Icon size={19} aria-hidden="true" />
      </span>
      <div>
        <dt className="text-xs font-medium text-content-sub">{label}</dt>
        <dd className="mt-0.5 text-xl font-extrabold leading-none tabular-nums text-content-main">{value}</dd>
      </div>
    </div>
  );
}

export default function TenantDashboard({ dashboard, loading, onRefresh }) {
  const finance = dashboard?.finance;

  return (
    <div className="space-y-5" aria-busy={loading}>
      <header className="relative isolate overflow-hidden rounded-3xl bg-emerald-950 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 -z-10 h-96 w-96 rounded-full border-[36px] border-emerald-400/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-36 -top-36 -z-10 h-[28rem] w-[28rem] rounded-full border border-emerald-400/25" />
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(17rem,23rem)] md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-200">
              <House size={16} aria-hidden="true" /> HavenStay
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Không gian của tôi</h1>
            {dashboard?.user.fullName && <p className="mt-2 text-sm text-emerald-100">Xin chào, <strong>{dashboard.user.fullName}</strong>.</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                <RotateCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                {loading ? 'Đang cập nhật' : 'Làm mới'}
              </button>
              {dashboard?.generatedAt && (
                <p className="text-xs text-emerald-200">
                  Cập nhật lúc {new Date(dashboard.generatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          {finance && (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><Wallet size={17} aria-hidden="true" /> Còn phải trả</p>
              <p className="mt-2 break-words text-3xl font-extrabold tabular-nums">{formatCurrency(finance.outstanding)}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-emerald-100">{finance.unpaidCount} hóa đơn cần thanh toán</p>
                <Link to="/invoices/my" className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-emerald-950 hover:bg-emerald-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  Xem hóa đơn <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      {dashboard && (
        <>
          <dl className="grid gap-3 sm:grid-cols-3">
            <DashboardStat icon={Building2} label="Hợp đồng đang hiệu lực" value={dashboard.contracts.length} />
            <DashboardStat icon={CalendarClock} label="Yêu cầu thuê đang chờ" value={dashboard.rentalRequestCount} />
            <DashboardStat icon={ClipboardList} label="Yêu cầu trả phòng đang chờ" value={dashboard.checkoutRequestCount} />
          </dl>

          {finance && (
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
              <section className={panel}>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-content-main">
                  <ReceiptText size={19} className="text-primary-dark" aria-hidden="true" /> Hóa đơn cần thanh toán
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-content-sub">Các hóa đơn đã gửi mà bạn là người thanh toán.</p>
                {finance.invoices.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {finance.invoices.map(invoice => (
                      <li key={invoice._id}>
                        <Link to={`/invoices/my/${invoice._id}`} className={`group flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-border px-3 py-3 transition hover:border-primary-200 hover:bg-primary-50 ${focusRing}`}>
                          <div>
                            <p className="text-sm font-bold text-content-main">{invoiceLabel(invoice)}</p>
                            <p className="mt-1 text-xs text-content-sub">
                              {invoice.roomNumber && `Phòng ${invoice.roomNumber} · `}Hạn {formatDate(invoice.dueDate)}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-2 text-sm font-extrabold tabular-nums text-primary-dark">
                            {formatCurrency(invoice.balance)}
                            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-4 rounded-xl bg-primary-50 p-4 text-sm font-semibold text-primary-dark">Bạn không có hóa đơn cần thanh toán.</p>}
              </section>

              <section className={panel}>
                <h2 className="flex items-center gap-2 text-base font-extrabold text-content-main">
                  <Wallet size={19} className="text-primary-dark" aria-hidden="true" /> Thanh toán gần đây
                </h2>
                {finance.recentPayments.length > 0 ? (
                  <ul className="mt-3 divide-y divide-surface-border">
                    {finance.recentPayments.map(payment => (
                      <li key={payment._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-dark">
                            <Check size={15} aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-content-main">{paymentLabels[payment.method] || 'Thanh toán thành công'}</p>
                            <p className="mt-0.5 text-xs text-content-sub">
                              {formatDate(payment.paidAt)} · {new Date(payment.paidAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold tabular-nums text-content-main">{formatCurrency(payment.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-4 rounded-xl bg-surface-bg p-4 text-sm text-content-sub">Chưa có giao dịch thành công.</p>}
              </section>
            </div>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-content-main">Phòng đang thuê</h2>
              <Link to="/contracts/my" className={`inline-flex items-center gap-1.5 rounded text-sm font-bold text-primary-dark hover:underline ${focusRing}`}>
                Xem hợp đồng <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            {dashboard.contracts.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {dashboard.contracts.map(contract => (
                  <article key={contract._id} className={panel}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-dark">
                          <Building2 size={20} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-lg font-extrabold text-content-main">Phòng {contract.room?.roomNumber || '—'}</h3>
                          {contract.room?.property?.name && <p className="break-words text-sm font-semibold text-content-sub">{contract.room.property.name}</p>}
                          {contract.room?.property?.address && <p className="mt-0.5 break-words text-xs text-content-sub">{contract.room.property.address}</p>}
                        </div>
                      </div>
                      <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-dark">
                        {contract.isRepresentative ? 'Đại diện hợp đồng' : 'Thành viên ở cùng'}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-surface-bg p-3 text-sm">
                      <div><dt className="text-xs text-content-sub">Bắt đầu</dt><dd className="mt-1 font-bold">{formatDate(contract.startDate)}</dd></div>
                      <div><dt className="text-xs text-content-sub">Hết hạn</dt><dd className="mt-1 font-bold">{formatDate(contract.endDate)}</dd></div>
                      <div><dt className="text-xs text-content-sub">Tiền thuê cả phòng / tháng</dt><dd className="mt-1 font-bold">{formatCurrency(contract.monthlyRent)}</dd></div>
                      <div><dt className="text-xs text-content-sub">Tiền cọc cả hợp đồng</dt><dd className="mt-1 font-bold">{formatCurrency(contract.depositAmount)}</dd></div>
                    </dl>
                    <p className="mt-3 text-xs font-medium text-content-sub">
                      {contract.memberCount} người trong hợp đồng{contract.room?.area != null && ` · ${contract.room.area} m²`}
                    </p>
                  </article>
                ))}
              </div>
            ) : <p className={`${panel} text-sm text-content-sub`}>Bạn chưa có hợp đồng đang có hiệu lực.</p>}
          </section>
        </>
      )}
    </div>
  );
}
