import { getCurrentUser } from '../../shared/utils/auth';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reportsAPI from './api/reports-api';

const currentMonth = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 7);
const number = value => Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
const money = value => `${number(value)} ₫`;
const dateTime = value =>
  new Date(value).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
const columns = [
  ['name', 'Dãy trọ'],
  ['rooms', 'Tổng phòng hiện tại'],
  ['available', 'Phòng trống hiện tại'],
  ['occupied', 'Phòng đang thuê hiện tại'],
  ['occupancyRate', 'Tỷ lệ lấp đầy hiện tại (%)'],
  ['invoiced', 'Phải thu trong tháng (₫)'],
  ['received', 'Đã thu trong tháng (₫)'],
  ['openingBalance', 'Nợ đầu kỳ (₫)'],
  ['outstanding', 'Còn nợ đến mốc báo cáo (₫)'],
  ['overdue', 'Nợ quá hạn đến mốc báo cáo (₫)'],
  ['electricityTotal', 'Tổng điện (kWh)'],
  ['electricityRooms', 'Số phòng có chỉ số điện hợp lệ'],
  ['electricityAverage', 'Điện trung bình (kWh/phòng)'],
  ['waterTotal', 'Tổng nước (m³)'],
  ['waterRooms', 'Số phòng có chỉ số nước hợp lệ'],
  ['waterAverage', 'Nước trung bình (m³/phòng)'],
];

export default function ReportsPage() {
  const isManager = getCurrentUser()?.role === 'manager';
  const [month, setMonth] = useState(currentMonth);
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
        if (!isManager && propertyId) filters.propertyId = propertyId;
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
  }, [month, propertyId, revision, isManager]);

  const exportCsv = () => {
    const escape = value =>
      String(value ?? 'Chưa có dữ liệu')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    const rows = [
      [
        'Báo cáo tháng',
        data.month,
        'Tiền tính đến',
        dateTime(data.asOf),
        'Phòng tính lúc',
        dateTime(data.generatedAt),
        data.provisional ? 'Tạm tính' : 'Báo cáo theo kỳ',
      ],
      columns.map(column => column[1]),
      ...data.rows.map(row => columns.map(([key]) => row[key])),
    ];
    const xmlRows = rows
      .map(
        row =>
          '<Row>' +
          row
            .map(
              value =>
                '<Cell><Data ss:Type="' +
                (typeof value === 'number' ? 'Number' : 'String') +
                '">' +
                escape(value) +
                '</Data></Cell>',
            )
            .join('') +
          '</Row>',
      )
      .join('');
    const spreadsheet =
      '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Báo cáo tháng"><Table>' +
      xmlRows +
      '</Table></Worksheet></Workbook>';
    const url = URL.createObjectURL(
      new Blob([spreadsheet], { type: 'application/xml;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-${data.month}.xml`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-semibold text-primary">HAVEN STAY</p>
        <h1 className="mt-2 text-2xl font-bold">Báo cáo tháng</h1>
        <p className="mt-2 text-sm text-content-sub">
          {isManager
            ? 'Chọn tháng để xem báo cáo dãy trọ bạn đang quản lý.'
            : 'Chọn tháng và dãy trọ để xem thu tiền, tình trạng phòng và điện nước.'}
        </p>
        <Link to="/dashboard" className="mt-2 inline-block text-sm text-primary">
          Về tổng quan
        </Link>
      </div>
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-surface-border bg-surface-card p-5">
        <label className="grid gap-2 text-sm font-medium">
          Tháng muốn xem
          <select
            aria-label="Tháng báo cáo"
            value={month.slice(5)}
            onChange={event => setMonth(month.slice(0, 4) + '-' + event.target.value)}
            className="rounded-xl border border-surface-border p-3"
          >
            {Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')).map(
              value => (
                <option
                  key={value}
                  value={value}
                  disabled={
                    month.slice(0, 4) === currentMonth().slice(0, 4) &&
                    value > currentMonth().slice(5)
                  }
                >
                  Tháng {Number(value)}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Năm
          <select
            aria-label="Năm báo cáo"
            value={month.slice(0, 4)}
            onChange={event => {
              const value = event.target.value + '-' + month.slice(5);
              setMonth(value > currentMonth() ? currentMonth() : value);
            }}
            className="rounded-xl border border-surface-border p-3"
          >
            {Array.from(
              { length: Number(currentMonth().slice(0, 4)) - 1999 },
              (_, index) => Number(currentMonth().slice(0, 4)) - index,
            ).map(year => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </label>
        {!isManager && (
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            Dãy trọ
            <select
              aria-label="Nhà trọ"
              value={propertyId}
              onChange={event => setPropertyId(event.target.value)}
              className="max-w-full rounded-xl border border-surface-border p-3 sm:max-w-xs"
            >
              <option value="">Tất cả dãy trọ được quản lý</option>
              {data?.properties.map(property => (
                <option key={property._id} value={property._id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          disabled={loading}
          onClick={() => setRevision(value => value + 1)}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Làm mới
        </button>
        <button
          disabled={loading || !data?.rows.length}
          onClick={exportCsv}
          className="rounded-xl border border-primary px-5 py-3 text-sm text-primary disabled:opacity-50"
        >
          Tải file Excel
        </button>
      </div>
      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
          <button onClick={() => setRevision(value => value + 1)} className="ml-3 underline">
            Thử lại
          </button>
          {propertyId && (
            <button onClick={() => setPropertyId('')} className="ml-3 underline">
              Xem tất cả dãy
            </button>
          )}
        </div>
      )}
      {loading ? (
        <p role="status">Đang tải báo cáo…</p>
      ) : (
        data && (
          <>
            <div className="flex flex-wrap items-center gap-3 text-sm text-content-sub">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                Tháng {data.month.slice(5)}/{data.month.slice(0, 4)}
              </span>
              <span>Cập nhật lúc {dateTime(data.generatedAt)}</span>
            </div>
            {data.provisional && (
              <div
                role="status"
                className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900"
              >
                <strong>Báo cáo tạm tính</strong>
                <p className="mt-1 text-sm">Tháng chưa kết thúc, số liệu có thể còn thay đổi.</p>
              </div>
            )}
            {isManager && data.properties.length > 0 && (
              <p className="text-sm text-content-sub">
                Dãy trọ đang quản lý:{' '}
                <strong className="text-content-main">
                  {data.properties.map(property => property.name).join(', ')}
                </strong>
              </p>
            )}
            {!data.rows.length && (
              <p className="rounded-2xl bg-white p-6">
                {isManager
                  ? 'Bạn chưa quản lý dãy trọ nào.'
                  : 'Bạn chưa có dãy trọ được phép xem báo cáo.'}
              </p>
            )}
            {data.rows.map(row => (
              <article
                key={row.propertyId}
                className="space-y-6 rounded-2xl border border-surface-border bg-surface-card p-5 sm:p-6"
              >
                <h2 className="text-xl font-bold">{row.name}</h2>
                <section aria-label={`Thu tiền - ${row.name}`}>
                  <h3 className="font-bold">Thu tiền trong tháng</h3>
                  <p className="mt-1 text-sm text-content-sub">
                    {data.provisional
                      ? 'Tính đến hôm nay'
                      : 'Tính đến hết ngày ' +
                        new Date(data.asOf).toLocaleDateString('vi-VN', {
                          timeZone: 'Asia/Ho_Chi_Minh',
                        })}
                  </p>
                  {!row.invoiceCount &&
                  !row.paymentCount &&
                  !row.outstanding &&
                  !row.openingBalance ? (
                    <div className="mt-4 rounded-xl border border-surface-border p-5">
                      <p className="font-semibold">
                        Tháng {Number(data.month.slice(5))}/{data.month.slice(0, 4)} chưa có hóa đơn
                        hoặc khoản thu nào.
                      </p>
                      <Link
                        to={`/invoices/new?propertyId=${row.propertyId}&billingMonth=${data.month}`}
                        onClick={() => localStorage.setItem('currentPropertyId', row.propertyId)}
                        className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                      >
                        Lập hóa đơn
                      </Link>
                    </div>
                  ) : (
                    <>
                      {!row.invoiceCount && (
                        <p className="mt-3 text-sm text-content-sub">
                          Tháng này chưa có hóa đơn mới. Các khoản bên dưới gồm thu tiền hoặc công
                          nợ từ kỳ trước.
                        </p>
                      )}
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          [
                            'Phải thu trong tháng',
                            row.invoiced,
                            'Tổng hóa đơn thuộc tháng chọn, bỏ hóa đơn hủy.',
                          ],
                          [
                            'Đã thu trong tháng',
                            row.received,
                            'Tiền thanh toán thành công trong tháng, kể cả trả nợ tháng trước.',
                          ],
                          [
                            data.provisional
                              ? 'Còn nợ đến hôm nay'
                              : 'Còn nợ đến hết ngày ' +
                                new Date(data.asOf).toLocaleDateString('vi-VN', {
                                  timeZone: 'Asia/Ho_Chi_Minh',
                                }),
                            row.outstanding,
                            'Gồm các hóa đơn chưa trả hết đến mốc báo cáo, kể cả tháng trước.',
                          ],
                          [
                            'Trong đó: nợ quá hạn',
                            row.overdue,
                            'Phần còn nợ đã qua hạn thanh toán tại mốc báo cáo.',
                          ],
                        ].map(([label, value, help]) => (
                          <div key={label} className="rounded-xl bg-primary/5 p-4">
                            <p className="text-sm text-content-sub">{label}</p>
                            <p className="mt-2 text-xl font-bold text-primary">{money(value)}</p>
                            <details className="mt-2 text-xs text-content-sub">
                              <summary
                                aria-label={`Giải thích ${label}`}
                                className="cursor-pointer text-primary"
                              >
                                ? Cách tính
                              </summary>
                              <p className="mt-2">{help}</p>
                            </details>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-sm text-content-sub">
                        Nợ từ các tháng trước chuyển sang:{' '}
                        <strong>{money(row.openingBalance)}</strong>.
                      </p>
                    </>
                  )}
                </section>
                <section
                  aria-label={`Phòng - ${row.name}`}
                  className="border-t border-surface-border pt-5"
                >
                  <h3 className="font-bold">Tình trạng phòng hiện tại</h3>
                  <p className="mt-1 text-sm text-content-sub">Tính đến hôm nay</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      ['Tổng số phòng', number(row.rooms)],
                      ['Phòng trống', number(row.available)],
                      ['Phòng đang thuê', number(row.occupied)],
                      ['Tỷ lệ lấp đầy', `${number(row.occupancyRate)}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-surface-border p-4">
                        <p className="text-sm text-content-sub">{label}</p>
                        <p className="mt-2 text-2xl font-bold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-content-sub">
                    Phòng bảo trì hoặc giữ chỗ vẫn thuộc tổng số phòng, không tính là phòng trống
                    hay đang thuê.
                  </p>
                </section>
                <section
                  aria-label={`Điện nước - ${row.name}`}
                  className="border-t border-surface-border pt-5"
                >
                  <h3 className="font-bold">Điện nước trong tháng</h3>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {[
                      [
                        'Điện',
                        row.electricityTotal,
                        row.electricityAverage,
                        row.electricityRooms,
                        'kWh',
                      ],
                      ['Nước', row.waterTotal, row.waterAverage, row.waterRooms, 'm³'],
                    ].map(([label, total, average, count, unit]) => (
                      <div key={label} className="rounded-xl border border-surface-border p-4">
                        <h4 className="font-semibold">{label}</h4>
                        {count ? (
                          <>
                            <p className="mt-2 text-xl font-bold text-primary">
                              {number(total)} {unit}
                            </p>
                            <p className="mt-2 text-sm">
                              Trung bình:{' '}
                              <strong>
                                {number(average)} {unit}/phòng
                              </strong>
                            </p>
                          </>
                        ) : (
                          <p className="mt-3 text-sm text-content-sub">
                            Tháng này chưa có số {label.toLowerCase()} để tính.
                          </p>
                        )}
                        {count > 0 && (
                          <p className="mt-2 text-xs text-content-sub">
                            Tính trên {count}/{row.rooms} phòng đã ghi số. Phòng chưa ghi số không
                            được tính là dùng 0.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/utility-readings?billingMonth=${data.month}`}
                    onClick={() => localStorage.setItem('currentPropertyId', row.propertyId)}
                    className="mt-3 inline-block text-sm font-semibold text-primary underline"
                  >
                    Ghi số điện nước
                  </Link>
                </section>
              </article>
            ))}
            <details className="rounded-2xl border border-surface-border bg-surface-card p-5 text-sm text-content-sub">
              <summary className="cursor-pointer font-semibold text-primary">
                Cách tính số liệu
              </summary>
              <div className="mt-4 space-y-3">
                <p>
                  Phải thu là tổng hóa đơn thuộc tháng chọn, bỏ hóa đơn hủy. Đã thu là các khoản
                  thanh toán thành công trong tháng, kể cả trả hóa đơn tháng trước. Không gồm tiền
                  cọc hợp đồng.
                </p>
                <p>
                  Còn nợ và quá hạn tính đến cuối tháng đã chọn; tháng hiện tại tính đến lúc xem.
                  Tiền trả sau mốc này không làm giảm nợ của kỳ cũ.
                </p>
                <p>
                  Phòng hiển thị tình trạng hiện tại. Điện nước lấy chỉ số mới trừ chỉ số cũ của
                  tháng chọn; phòng thiếu hoặc sai chỉ số không được coi là dùng 0.
                </p>
                <p>
                  Báo cáo dựa trên dữ liệu đang lưu, chưa trừ hoàn tiền. Hóa đơn sửa hoặc hủy về sau
                  có thể thay đổi báo cáo tháng cũ; đây chưa phải bản chốt sổ.
                </p>
              </div>
            </details>
          </>
        )
      )}
    </section>
  );
}
