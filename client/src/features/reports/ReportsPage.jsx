import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reportsAPI from './api/reports-api';

const columns = [
  ['name', 'Nhà trọ'],
  ['rooms', 'Tổng phòng'],
  ['occupied', 'Đang ở'],
  ['available', 'Trống'],
  ['occupancyRate', 'Tỷ lệ ở (%)'],
  ['activeContracts', 'HĐ hiệu lực'],
  ['newContracts', 'HĐ tạo trong kỳ'],
  ['rentalRequests', 'Yêu cầu thuê'],
  ['checkoutRequests', 'Yêu cầu trả phòng'],
  ['invoiced', 'Phải thu (₫)'],
  ['received', 'Thực thu (₫)'],
  ['outstanding', 'Còn nợ (₫)'],
  ['overdue', 'Nợ quá hạn (₫)'],
  ['historicalOccupied', 'Đang ở cuối kỳ'],
  ['historicalAvailable', 'Trống cuối kỳ'],
  ['historicalMaintenance', 'Bảo trì cuối kỳ'],
  ['historicalReserved', 'Giữ chỗ cuối kỳ'],
  ['historicalUnknown', 'Chưa có lịch sử cuối kỳ'],
];
export default function ReportsPage() {
  const [month, setMonth] = useState(() =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 7),
  );
  const [propertyId, setPropertyId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const fetchReports = async () => {
      setLoading(true);
      setError('');
      try {
        const filters = { month };
        if (propertyId) filters.propertyId = propertyId;
        const response = await reportsAPI.getReports(filters, controller.signal);
        if (!controller.signal.aborted) setData(response.data);
      } catch (error) {
        if (!controller.signal.aborted) {
          setData(null);
          setError(error.response?.data?.message || 'Không tải được báo cáo. Vui lòng thử lại.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchReports();
    return () => controller.abort();
  }, [month, propertyId, revision]);

  const exportCsv = () => {
    const escape = value => {
      let text = String(value ?? '');
      if (/^[=+@\-\t\r\n]/.test(text)) text = "'" + text;
      return '"' + text.replaceAll('"', '""') + '"';
    };
    const rows = [
      columns.map(column => column[1]),
      ...data.rows.map(row => columns.map(([key]) => row[key])),
    ];
    const csv = '\uFEFF' + rows.map(row => row.map(escape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-${data.month}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">HAVEN STAY</p>
        <h1 className="mt-2 text-2xl font-bold">Báo cáo & doanh thu</h1>
        <Link to="/dashboard" className="text-sm text-primary">
          Về tổng quan
        </Link>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-surface-border bg-surface-card p-5">
        <label className="text-sm">
          Tháng báo cáo
          <input
            aria-label="Tháng báo cáo"
            type="month"
            min="2000-01"
            max="2099-12"
            value={month}
            onChange={event => {
              if (event.target.value) setMonth(event.target.value);
            }}
            className="ml-2 rounded-xl border p-2"
          />
        </label>
        <label className="text-sm">
          Nhà trọ
          <select
            aria-label="Nhà trọ"
            value={propertyId}
            onChange={event => setPropertyId(event.target.value)}
            className="ml-2 max-w-xs rounded-xl border p-2"
          >
            <option value="">Tất cả được quản lý</option>
            {data?.properties.map(property => (
              <option key={property._id} value={property._id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={loading}
          onClick={() => setRevision(value => value + 1)}
          className="rounded-xl bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Làm mới
        </button>
        <button
          disabled={loading || !data?.rows.length}
          onClick={exportCsv}
          className="rounded-xl border border-primary px-4 py-2 text-sm text-primary disabled:opacity-50"
        >
          Xuất CSV
        </button>
      </div>
      {error && (
        <div role="alert" className="text-status-danger">
          {error}
          {propertyId && (
            <button className="ml-3 underline" onClick={() => setPropertyId('')}>
              Bỏ chọn nhà trọ
            </button>
          )}
        </div>
      )}
      {loading ? (
        <p role="status">Đang tải báo cáo…</p>
      ) : (
        data && (
          <>
            <p className="text-sm text-content-sub">
              Kỳ {data.month} · Cập nhật {new Date(data.generatedAt).toLocaleString('vi-VN')}
            </p>
            {!data.rows.length ? (
              <p>Bạn chưa có nhà trọ được phép xem báo cáo.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-surface-border bg-surface-card p-4">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      {columns.map(([key, label]) => (
                        <th key={key} className="whitespace-nowrap p-3">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map(row => (
                      <tr key={row.propertyId} className="border-t border-surface-border">
                        {columns.map(([key]) => (
                          <td key={key} className="whitespace-nowrap p-3">
                            {typeof row[key] === 'number'
                              ? row[key].toLocaleString('vi-VN')
                              : row[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!!data.rows.length &&
              data.rows.every(row => !row.invoiceCount && !row.paymentCount) && (
                <p className="text-sm text-content-sub">
                  Chưa có hóa đơn hoặc giao dịch thành công trong kỳ báo cáo này.
                </p>
              )}
          </>
        )
      )}
      <div className="space-y-2 rounded-2xl bg-primary/5 p-5 text-sm text-content-sub">
        <p>
          Phòng và hợp đồng hiệu lực: trạng thái tại lúc xem. Các cột cuối kỳ dùng lịch sử các phòng
          hiện thuộc nhà này tại cuối tháng (tháng hiện tại tính đến lúc xem). Phòng chưa có lịch sử
          được ghi riêng, không suy đoán trạng thái quá khứ.
        </p>
        <p>
          Hợp đồng mới và yêu cầu thuê/trả phòng: đếm theo ngày tạo trong tháng, tính theo giờ Việt
          Nam; gồm tất cả trạng thái.
        </p>
        <p>
          Phải thu: tổng hóa đơn của tháng, loại hóa đơn hủy. Còn nợ/quá hạn: số dư hiện tại của các
          hóa đơn đó.
        </p>
        <p>
          Thực thu: tổng giao dịch thành công có ngày thanh toán trong tháng, kể cả thanh toán cho
          hóa đơn kỳ khác. Chưa trừ hoàn tiền, không phải lợi nhuận.
        </p>
      </div>
    </section>
  );
}
