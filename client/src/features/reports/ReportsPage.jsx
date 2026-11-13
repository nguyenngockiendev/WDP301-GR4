import { BarChart3, Download, RefreshCw, ArrowLeft, Clock3 } from 'lucide-react';
import PropertyReport from './PropertyReport';
import { getCurrentUser } from '../../shared/utils/auth';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import reportsAPI from './api/reports-api';

const currentMonth = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).slice(0, 7);
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
    <section className="mx-auto max-w-7xl space-y-6 p-4 sm:px-8 sm:py-8">
      <div className="flex items-start gap-4">
        <span className="hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 p-3.5 text-white shadow-lg shadow-emerald-900/10 sm:flex">
          <BarChart3 size={28} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
            HAVEN STAY / BÁO CÁO
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Báo cáo tháng</h1>
          <p className="mt-2 text-sm text-content-sub">
            {isManager
              ? 'Chọn tháng để xem báo cáo dãy trọ bạn đang quản lý.'
              : 'Chọn tháng và dãy trọ để xem thu tiền, tình trạng phòng và điện nước.'}
          </p>
          <Link
            to="/dashboard"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <ArrowLeft size={13} /> Về tổng quan
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-sm sm:p-5">
        <label className="grid gap-2 text-sm font-medium">
          Tháng muốn xem
          <select
            aria-label="Tháng báo cáo"
            value={month.slice(5)}
            onChange={event => setMonth(month.slice(0, 4) + '-' + event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-emerald-100"
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
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-content-sub transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Làm mới
        </button>
        <button
          disabled={loading || !data?.rows.length}
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-50 sm:ml-auto"
        >
          <Download size={16} /> Tải file Excel
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
                className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-amber-900"
              >
                <strong className="inline-flex items-center gap-2 text-sm">
                  <Clock3 size={16} /> Báo cáo tạm tính
                </strong>
                <p className="mt-1 text-xs">Tháng chưa kết thúc, số liệu có thể còn thay đổi.</p>
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
            <div className="space-y-10">
              {data.rows.map(row => (
                <PropertyReport
                  key={row.propertyId}
                  row={row}
                  month={data.month}
                  provisional={data.provisional}
                  asOf={data.asOf}
                />
              ))}
            </div>
            <details className="rounded-2xl border border-slate-200/80 bg-white/70 p-5 text-sm text-content-sub">
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
