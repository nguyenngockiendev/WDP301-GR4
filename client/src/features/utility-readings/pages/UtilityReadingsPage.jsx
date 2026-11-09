import { useState } from 'react';
import { Save } from 'lucide-react';
import UtilityReadingsTable from '../components/UtilityReadingsTable';
import useUtilityReadings from '../hooks/useUtilityReadings';

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function UtilityReadingsPage() {
  const {
    properties,
    propertyId,
    selectProperty,
    billingMonth,
    selectBillingMonth,
    loadingProperties,
    loadingRooms,
    loadingReadings,
    validMonth,
    error,
    rateError,
    rooms,
    contracts,
    readings,
    changeReading,
    pendingCount,
    saving,
    saveReadings,
    saveError,
  } = useUtilityReadings();
  const [roomStatus, setRoomStatus] = useState('all');
  const [previewRoomId, setPreviewRoomId] = useState('');

  const property = properties.find(item => item._id === propertyId);
  const visibleRooms = rooms.filter(room => roomStatus === 'all' || room.status === roomStatus);
  const loading = loadingProperties || loadingRooms || loadingReadings;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pt-4">
      <div>
        <p className="text-xs font-semibold text-content-sub">
          Dịch vụ &amp; tài chính <span className="px-1">/</span>{' '}
          <span className="text-primary-dark">Điện nước</span>
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-content-main sm:text-3xl">
          Ghi chỉ số điện nước
        </h1>
        <p className="mt-1 text-sm text-content-sub">
          Nhập chỉ số theo phòng và kỳ, sau đó xem tiền điện nước tạm tính.
        </p>
      </div>

      <section className="space-y-5 rounded-3xl border border-white bg-white/90 p-4 shadow-card backdrop-blur-md sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-bold text-content-main">
            Nhà trọ
            <select
              className={fieldClass}
              value={propertyId}
              disabled={saving || loadingProperties || !properties.length}
              onChange={event => {
                selectProperty(event.target.value);
                setPreviewRoomId('');
              }}
            >
              {!properties.length && (
                <option value="">{loadingProperties ? 'Đang tải…' : 'Chưa có nhà trọ'}</option>
              )}
              {properties.map(item => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold text-content-main">
            Kỳ ghi chỉ số
            <input
              type="month"
              className={fieldClass}
              value={billingMonth}
              disabled={saving}
              onChange={event => {
                selectBillingMonth(event.target.value);
                setPreviewRoomId('');
              }}
            />
          </label>
          <label className="text-sm font-bold text-content-main">
            Trạng thái phòng
            <select
              className={fieldClass}
              value={roomStatus}
              onChange={event => {
                setRoomStatus(event.target.value);
                setPreviewRoomId('');
              }}
            >
              <option value="all">Tất cả</option>
              <option value="occupied">Đang thuê</option>
              <option value="available">Còn trống</option>
              <option value="reserved">Đã đặt trước</option>
              <option value="maintenance">Bảo trì</option>
            </select>
          </label>
        </div>

        {loading && (
          <p role="status" className="py-6 text-center text-sm text-content-sub">
            Đang tải dữ liệu…
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}
        {!loading && !error && !properties.length && (
          <p className="py-6 text-center text-sm text-content-sub">
            Bạn chưa có nhà trọ được phép quản lý.
          </p>
        )}
        {!loading && !error && property && !validMonth && (
          <p className="py-6 text-center text-sm text-content-sub">
            Chọn kỳ ghi chỉ số để nhập dữ liệu.
          </p>
        )}
        {!loading &&
          !error &&
          property &&
          validMonth &&
          (visibleRooms.length ? (
            <>
              <p className="text-xs text-content-sub">
                Số cũ lấy từ lần ghi trước. Nếu là lần đầu, nhập chỉ số bàn giao và số mới.
              </p>
              <UtilityReadingsTable
                rooms={visibleRooms}
                contracts={contracts}
                propertyRate={property.utilityRate}
                billingMonth={billingMonth}
                rateError={rateError}
                readings={readings}
                changeReading={changeReading}
                saving={saving}
                previewRoomId={previewRoomId}
                setPreviewRoomId={setPreviewRoomId}
              />
            </>
          ) : (
            <p className="py-6 text-center text-sm text-content-sub">
              {rooms.length ? 'Không có phòng phù hợp với bộ lọc.' : 'Nhà trọ này chưa có phòng.'}
            </p>
          ))}

        {saveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{saveError}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-border pt-4">
          <p className="text-xs text-content-sub">
            <kbd className="mr-2 rounded-md border border-surface-border bg-slate-50 px-2 py-1 font-semibold">
              Tab
            </kbd>
            Chuyển ô nhập
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {pendingCount > 0 && <p className="text-xs text-content-sub">{pendingCount} phòng chưa lưu trong kỳ</p>}
            <button
              type="button"
              onClick={saveReadings}
              disabled={saving || loading || Boolean(error) || !validMonth || !pendingCount}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-emerald px-4 py-2.5 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} /> {saving ? 'Đang lưu…' : 'Lưu chỉ số'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
