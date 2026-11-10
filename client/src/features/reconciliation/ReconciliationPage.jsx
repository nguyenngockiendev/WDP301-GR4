import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reconciliationAPI from './api/reconciliation-api';

const labels = { review: 'Cần kiểm tra' };
const paymentLabels = {
  pending: 'Chờ xác nhận',
  success: 'Thành công',
  failed: 'Thất bại',
  cancelled: 'Đã hủy',
};
const invoiceLabels = {
  unpaid: 'Chưa trả',
  partially_paid: 'Trả một phần',
  paid: 'Đã trả',
  overdue: 'Quá hạn',
  cancelled: 'Đã hủy',
};
const eventLabels = {
  RECEIVED: 'Đã nhận',
  PROCESSING: 'Đang xử lý',
  APPLIED: 'Đã áp dụng kết quả',
  DUPLICATE: 'Giao dịch đã xử lý',
  ORDER_NOT_FOUND: 'Không tìm thấy giao dịch/hóa đơn',
  AMOUNT_MISMATCH: 'Sai số tiền',
  INVALID_SIGNATURE: 'Xác minh không hợp lệ',
  INVALID_PAYLOAD: 'Dữ liệu không hợp lệ',
  ERROR: 'Lỗi xử lý',
};
const money = value => `${Number(value).toLocaleString('vi-VN')} ₫`;
export default function ReconciliationPage() {
  const [month, setMonth] = useState(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 7),
  );
  const [propertyId, setPropertyId] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const fetchReconciliation = async () => {
      setLoading(true);
      setError('');
      try {
        const filters = { month, status, page };
        if (propertyId) filters.propertyId = propertyId;
        const response = await reconciliationAPI.getReconciliation(filters, controller.signal);
        if (!controller.signal.aborted) setData(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setData(null);
          setError(error.response?.data?.message || 'Không tải được đối soát. Vui lòng thử lại.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchReconciliation();
    return () => controller.abort();
  }, [month, propertyId, status, page, revision]);
  const inputClass = 'rounded-xl border border-surface-border bg-white p-2 text-sm';
  return (
    <section className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">HAVEN STAY</p>
        <h1 className="mt-2 text-2xl font-bold">Đối soát nội bộ</h1>
        <p className="mt-2 text-sm text-content-sub">
          So sánh số tiền đã ghi nhận trên hóa đơn với tổng giao dịch thành công trong hệ thống.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-surface-border bg-white p-5">
        <label className="grid gap-2 text-sm">
          Kỳ hóa đơn
          <input
            className={inputClass}
            type="month"
            min="2000-01"
            max="2099-12"
            value={month}
            onChange={event => {
              if (event.target.value) {
                setMonth(event.target.value);
                setPage(1);
              }
            }}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Dãy trọ
          <select
            aria-label="Dãy trọ đối soát"
            className={`${inputClass} max-w-xs`}
            value={propertyId}
            onChange={event => {
              setPropertyId(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả được phân công</option>
            {data?.properties.map(item => (
              <option key={item._id} value={item._id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Kết quả
          <select
            aria-label="Kết quả đối soát"
            className={inputClass}
            value={status}
            onChange={event => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tất cả</option>
            {Object.entries(labels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={loading}
          onClick={() => setRevision(value => value + 1)}
          className="rounded-xl bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          Làm mới
        </button>
      </div>
      <p className="rounded-xl bg-primary/10 p-4 text-sm text-content-sub">
        Màn này kiểm tra dữ liệu nội bộ, không xác nhận tiền thực nhận tại ngân hàng/VNPay. Kỳ lọc
        là tháng hóa đơn; tổng thu gồm mọi giao dịch thành công của hóa đơn đó, kể cả thanh toán ở
        tháng khác. Màn này không tự sửa hóa đơn hoặc giao dịch.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Đang kiểm tra dữ liệu…</p>
      ) : (
        data && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[['total', 'Hóa đơn trong kỳ'], ...Object.entries(labels)].map(([key, label]) => (
                <div key={key} className="rounded-2xl border border-surface-border bg-white p-4">
                  <p className="text-sm text-content-sub">{label}</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{data.summary[key]}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-content-sub">
              Cập nhật {new Date(data.generatedAt).toLocaleString('vi-VN')} · Chênh lệch = tiền hóa
              đơn đã ghi nhận − tổng giao dịch thành công.
            </p>
            {!data.items.length && (
              <p className="rounded-2xl bg-white p-6">Không có hóa đơn phù hợp với bộ lọc.</p>
            )}
            {data.items.map(row => (
              <article
                key={row.invoiceId}
                className="space-y-4 rounded-2xl border border-surface-border bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">
                      Phòng {row.roomNumber} · {row.propertyName}
                    </h2>
                    <Link
                      className="break-all text-sm text-primary hover:underline"
                      to={`/invoices/${row.invoiceId}`}
                    >
                      Hóa đơn {row.invoiceId}
                    </Link>
                    <p className="text-sm text-content-sub">
                      {invoiceLabels[row.invoiceStatus] || row.invoiceStatus}
                    </p>
                  </div>
                  {row.status === 'review' && (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                      Cần kiểm tra
                    </span>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                  {[
                    ['Tổng hóa đơn', row.totalAmount],
                    ['Hóa đơn đã ghi nhận', row.recorded],
                    ['Giao dịch thành công', row.received],
                    ['Chênh lệch', row.difference],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-content-sub">{label}</dt>
                      <dd className="font-semibold">{money(value)}</dd>
                    </div>
                  ))}
                </dl>
                {!!row.issues.length && (
                  <ul className="list-inside list-disc rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {row.issues.map(issue => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-primary">
                    Giao dịch liên quan ({row.transactions.length})
                  </summary>
                  {!row.transactions.length && (
                    <p className="mt-3 text-sm text-content-sub">Chưa có giao dịch.</p>
                  )}
                  <ul className="mt-3 divide-y divide-surface-border">
                    {row.transactions.map(item => (
                      <li key={item._id} className="space-y-1 py-3 text-sm">
                        <p className="break-all font-semibold">
                          {item._id} · {paymentLabels[item.status] || item.status} ·{' '}
                          {money(item.amount)}
                        </p>
                        <p>
                          {item.method === 'gateway'
                            ? (item.provider || 'vnpay').toUpperCase()
                            : item.method === 'cash'
                              ? 'Tiền mặt'
                              : 'Chuyển khoản'}{' '}
                          · {new Date(item.paidAt || item.createdAt).toLocaleString('vi-VN')}
                        </p>
                        {item.gatewayTransactionId && (
                          <p className="break-all text-content-sub">
                            Mã cổng: {item.gatewayTransactionId}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-primary">
                    Nhật ký IPN/Return ({row.gatewayEventCount || 0})
                  </summary>
                  <p className="mt-2 text-xs text-content-sub">
                    Tối đa 20 lần nhận gần nhất. Nhật ký chỉ có từ khi bật chức năng; không có nhật
                    ký không có nghĩa giao dịch sai.
                  </p>
                  {!row.gatewayEvents?.length && (
                    <p className="mt-2 text-sm text-content-sub">
                      Chưa có nhật ký callback cho các giao dịch này.
                    </p>
                  )}
                  <ul className="mt-2 divide-y divide-surface-border">
                    {row.gatewayEvents?.map(event => (
                      <li key={event._id} className="space-y-1 py-3 text-sm">
                        <p className="font-semibold">
                          {event.source} · {new Date(event.receivedAt).toLocaleString('vi-VN')} ·{' '}
                          {eventLabels[event.processResult] || event.processResult}
                        </p>
                        <p className="break-all">Mã giao dịch: {event.txnRef}</p>
                        <p>
                          Xác minh:{' '}
                          {event.signatureValid === true
                            ? 'Hợp lệ'
                            : event.signatureValid === false
                              ? 'Không hợp lệ'
                              : 'Chưa xác minh'}{' '}
                          · Số tiền callback:{' '}
                          {event.amount == null ? 'Không hợp lệ' : money(event.amount)}
                        </p>
                        <p>
                          Mã phản hồi: {event.responseCode || '—'} · Trạng thái cổng gửi:{' '}
                          {event.transactionStatus || '—'}
                        </p>
                        {event.gatewayTransactionNo && (
                          <p className="break-all">
                            Mã giao dịch cổng: {event.gatewayTransactionNo}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
            <div className="flex items-center justify-between gap-3 text-sm">
              <span>
                {data.total} hóa đơn · Trang {page}/{Math.max(1, data.totalPages)}
              </span>
              <div className="flex gap-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(value => value - 1)}
                  className="text-primary disabled:opacity-40"
                >
                  Trước
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(value => value + 1)}
                  className="text-primary disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )
      )}
    </section>
  );
}
