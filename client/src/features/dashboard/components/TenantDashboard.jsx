import { Link } from 'react-router-dom';

export default function TenantDashboard({ dashboard }) {
  return (
    <div className="space-y-4">
      {dashboard.finance && (
        <section className="space-y-4 rounded-2xl border border-surface-border bg-surface-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold">Hóa đơn và thanh toán</h2>
            <Link to="/invoices/my" className="text-sm font-semibold text-primary">
              Xem hóa đơn
            </Link>
          </div>
          <p>
            Còn phải trả: <strong>{dashboard.finance.outstanding.toLocaleString('vi-VN')} ₫</strong>
            {' · '}
            {dashboard.finance.unpaidCount} hóa đơn
          </p>
          <p className="text-sm text-content-sub">
            Chỉ tính hóa đơn đã gửi mà bạn là người chịu trách nhiệm thanh toán.
          </p>
          {!dashboard.finance.invoices.length && (
            <p className="text-sm">Không có hóa đơn cần thanh toán.</p>
          )}
          {dashboard.finance.invoices.map(invoice => (
            <Link
              key={invoice._id}
              to={`/invoices/my/${invoice._id}`}
              className="block rounded-xl border border-surface-border p-3 text-sm hover:border-primary"
            >
              {invoice.invoiceType === 'deposit' ? 'Tiền đặt cọc' : `Kỳ ${invoice.billingMonth}`} · Còn {invoice.balance.toLocaleString('vi-VN')} ₫{' · '}Hạn{' '}
              {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}
            </Link>
          ))}
          <h3 className="font-semibold">Thanh toán thành công gần đây</h3>
          {!dashboard.finance.recentPayments.length && (
            <p className="text-sm text-content-sub">Chưa có giao dịch thành công.</p>
          )}
          {dashboard.finance.recentPayments.map(payment => (
            <p key={payment._id} className="text-sm">
              {new Date(payment.paidAt).toLocaleString('vi-VN')} ·{' '}
              {payment.amount.toLocaleString('vi-VN')} ₫
            </p>
          ))}
        </section>
      )}
      <div className="flex flex-wrap gap-6 rounded-2xl border border-surface-border bg-surface-card p-5 text-sm">
        <p>
          Yêu cầu thuê đang chờ: <strong>{dashboard.rentalRequestCount}</strong>
        </p>
        <p>
          Yêu cầu trả phòng đang chờ: <strong>{dashboard.checkoutRequestCount}</strong>
        </p>
      </div>
      <h2 className="font-bold">Hợp đồng đang thuê ({dashboard.contracts.length})</h2>
      {!dashboard.contracts.length && (
        <p className="rounded-2xl bg-surface-card p-6 text-content-sub">
          Bạn chưa có hợp đồng đang có hiệu lực.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {dashboard.contracts.map(contract => (
          <article
            key={contract._id}
            className="rounded-2xl border border-surface-border bg-surface-card p-6 shadow-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold">Phòng {contract.room?.roomNumber || '—'}</h3>
              <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
                {contract.isRepresentative ? 'Đại diện hợp đồng' : 'Thành viên ở cùng'}
              </span>
            </div>
            <p className="mt-3 font-semibold">
              {contract.room?.property?.name || 'Chưa có thông tin nhà trọ'}
            </p>
            <p className="mt-1 text-sm text-content-sub">{contract.room?.property?.address}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-content-sub">Ngày bắt đầu</dt>
                <dd>{new Date(contract.startDate).toLocaleDateString('vi-VN')}</dd>
              </div>
              <div>
                <dt className="text-content-sub">Ngày hết hạn</dt>
                <dd>{new Date(contract.endDate).toLocaleDateString('vi-VN')}</dd>
              </div>
              <div>
                <dt className="text-content-sub">Tiền thuê cả phòng / tháng</dt>
                <dd>{contract.monthlyRent.toLocaleString('vi-VN')} ₫</dd>
              </div>
              <div>
                <dt className="text-content-sub">Tiền cọc cả hợp đồng</dt>
                <dd>{contract.depositAmount.toLocaleString('vi-VN')} ₫</dd>
              </div>
              <div>
                <dt className="text-content-sub">Số người trong hợp đồng</dt>
                <dd>{contract.memberCount}</dd>
              </div>
              <div>
                <dt className="text-content-sub">Diện tích</dt>
                <dd>{contract.room?.area ?? '—'} m²</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
