import { Fragment } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../../shared/utils/format';

const formatNumber = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 6 });

function getUsage(oldNumber, newNumber) {
  const oldReading = Number(oldNumber);
  const newReading = Number(newNumber);
  if (!Number.isFinite(oldReading) || oldReading < 0) {
    return { used: null, error: 'Số cũ phải là số không âm.', invalidInput: 'old' };
  }
  if (!Number.isFinite(newReading) || newReading < 0) {
    return { used: null, error: 'Số mới phải là số không âm.', invalidInput: 'new' };
  }
  if (oldNumber === '' || newNumber === '') return { used: null, error: '' };
  if (newReading < oldReading) {
    return { used: null, error: 'Số mới phải lớn hơn hoặc bằng số cũ.', invalidInput: 'new' };
  }
  return { used: newReading - oldReading, error: '' };
}

function getUtilityRate(room, contracts, propertyRate, billingMonth, rateError) {
  if (rateError) return { error: rateError };

  const monthStart = new Date(billingMonth + '-01T00:00:00+07:00');
  const [year, month] = billingMonth.split('-').map(Number);
  const monthEnd = Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000;
  const roomContracts = contracts.filter(contract =>
      String(contract.room?._id || contract.room) === String(room._id) &&
      contract.status === 'active' &&
      new Date(contract.startDate) < monthEnd &&
      new Date(contract.endDate) >= monthStart,
  );

  if (roomContracts.length > 1) {
    return { error: 'Phòng có nhiều hợp đồng trong kỳ. Cần đối chiếu đơn giá trước khi tính.' };
  }

  const contractRate = roomContracts[0]?.utilityRateSnapshot;
  const electricityPrice = contractRate?.electricityPrice ?? propertyRate?.electricityPrice;
  const waterPrice = contractRate?.waterPrice ?? propertyRate?.waterPrice;
  const validPrice = price => Number.isFinite(price) && price >= 0;

  if (!validPrice(electricityPrice) || !validPrice(waterPrice)) {
    return { error: 'Chưa có đủ đơn giá điện và nước.' };
  }

  return {
    electricityPrice,
    waterPrice,
    source:
      contractRate?.electricityPrice != null && contractRate?.waterPrice != null
        ? 'Đơn giá theo hợp đồng'
        : 'Dùng đơn giá nhà trọ cho phần chưa có giá hợp đồng',
  };
}

function ReadingInput({ label, value, onChange, errorId, readOnly }) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      inputMode="decimal"
      aria-label={label}
      aria-invalid={Boolean(errorId)}
      aria-describedby={errorId || undefined}
      placeholder="—"
      value={value}
      onChange={event => onChange(event.target.value)}
      className={`w-full min-w-[5rem] rounded-xl border bg-white px-3 py-2 text-sm tabular-nums outline-none focus:ring-2 focus:ring-primary/20 ${errorId ? 'border-status-danger' : 'border-surface-border focus:border-primary'}`}
    />
  );
}

function UtilityEstimate({ roomNumber, electricityUsed, waterUsed, rate }) {
  const hasReadings = electricityUsed !== null && waterUsed !== null;
  const electricityAmount =
    hasReadings && !rate.error ? Math.round(electricityUsed * rate.electricityPrice) : null;
  const waterAmount = hasReadings && !rate.error ? Math.round(waterUsed * rate.waterPrice) : null;

  return (
    <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-4">
      <h3 className="font-extrabold text-content-main">Điện nước tạm tính · {roomNumber}</h3>
      {rate.error || !hasReadings ? (
        <p className="mt-2 text-sm text-content-sub">
          {rate.error || 'Nhập đủ chỉ số cũ và mới hợp lệ để xem tạm tính.'}
        </p>
      ) : (
        <>
          <p className="mb-3 mt-1 text-xs text-content-sub">{rate.source}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-primary-100 bg-white p-3">
              <p className="font-bold">Tiền điện</p>
              <p className="my-1 text-xs text-content-sub">
                {formatNumber.format(electricityUsed)} kWh × {formatCurrency(rate.electricityPrice)}
              </p>
              <p className="font-extrabold">{formatCurrency(electricityAmount)}</p>
            </div>
            <div className="rounded-xl border border-primary-100 bg-white p-3">
              <p className="font-bold">Tiền nước</p>
              <p className="my-1 text-xs text-content-sub">
                {formatNumber.format(waterUsed)} m³ × {formatCurrency(rate.waterPrice)}
              </p>
              <p className="font-extrabold">{formatCurrency(waterAmount)}</p>
            </div>
            <div className="rounded-xl bg-primary-100 p-3 text-primary-900">
              <p className="text-sm font-bold">Tổng điện nước tạm tính</p>
              <p className="mt-1 text-2xl font-black">
                {formatCurrency(electricityAmount + waterAmount)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function UtilityReadingsTable({
  rooms,
  propertyId,
  contracts,
  propertyRate,
  billingMonth,
  rateError,
  readings,
  changeReading,
  previewRoomId,
  setPreviewRoomId,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-content-sub">
          <tr>
            <th rowSpan={2} scope="col" className="px-4 py-3">
              Phòng
            </th>
            <th
              colSpan={3}
              scope="colgroup"
              className="bg-amber-50 px-4 py-2 text-center text-amber-900"
            >
              Điện
            </th>
            <th
              colSpan={3}
              scope="colgroup"
              className="bg-sky-50 px-4 py-2 text-center text-sky-900"
            >
              Nước
            </th>
            <th rowSpan={2} scope="col" className="px-4 py-3">
              Trạng thái
            </th>
          </tr>
          <tr className="border-t border-surface-border">
            <th scope="col" className="px-3 py-2">
              Số cũ
            </th>
            <th scope="col" className="px-3 py-2">
              Số mới
            </th>
            <th scope="col" className="whitespace-nowrap px-3 py-2">
              Dùng (kWh)
            </th>
            <th scope="col" className="px-3 py-2">
              Số cũ
            </th>
            <th scope="col" className="px-3 py-2">
              Số mới
            </th>
            <th scope="col" className="whitespace-nowrap px-3 py-2">
              Dùng (m³)
            </th>
          </tr>
        </thead>
        <tbody>
          {rooms.map(room => {
            const roomId = room._id;
            const reading = readings[roomId] || {};
            const oldElectricity = reading.oldElectricity ?? '';
            const newElectricity = reading.newElectricity ?? '';
            const oldWater = reading.oldWater ?? '';
            const newWater = reading.newWater ?? '';
            const electricity = getUsage(oldElectricity, newElectricity);
            const water = getUsage(oldWater, newWater);
            const hasInput = [oldElectricity, newElectricity, oldWater, newWater].some(
              value => value !== '',
            );
            const readingStatus = reading.isRecorded ? 'Đã ghi' : hasInput ? 'Chưa lưu' : 'Chưa ghi';
            const statusColor = {
              'Đã ghi': 'bg-emerald-100 text-emerald-800',
              'Chưa lưu': 'bg-amber-100 text-amber-800',
              'Chưa ghi': 'bg-slate-100 text-content-sub',
            }[readingStatus];
            const previewOpen = previewRoomId === roomId;
            const electricityErrorId = electricity.error
              ? `electricity-error-${roomId}`
              : undefined;
            const waterErrorId = water.error ? `water-error-${roomId}` : undefined;

            return (
              <Fragment key={roomId}>
                <tr className="border-t border-surface-border align-top">
                  <th scope="row" className="px-4 py-4 font-extrabold">
                    {room.roomNumber}
                  </th>
                  <td className="px-3 py-3">
                    <ReadingInput
                      label={`Điện cũ phòng ${room.roomNumber}`}
                      value={oldElectricity}
                      errorId={electricity.invalidInput === 'old' ? electricityErrorId : undefined}
                      onChange={value => changeReading(roomId, 'oldElectricity', value)}
                    />
                    {electricity.invalidInput === 'old' && (
                      <p id={electricityErrorId} className="mt-1 text-xs text-status-danger">
                        {electricity.error}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <ReadingInput
                      label={`Điện mới phòng ${room.roomNumber}`}
                      value={newElectricity}
                      errorId={electricity.invalidInput === 'new' ? electricityErrorId : undefined}
                      onChange={value => changeReading(roomId, 'newElectricity', value)}
                    />
                    {electricity.invalidInput === 'new' && (
                      <p id={electricityErrorId} className="mt-1 text-xs text-status-danger">
                        {electricity.error}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4 font-bold tabular-nums">
                    {electricity.used === null ? '—' : formatNumber.format(electricity.used)}
                  </td>
                  <td className="px-3 py-3">
                    <ReadingInput
                      label={`Nước cũ phòng ${room.roomNumber}`}
                      value={oldWater}
                      errorId={water.invalidInput === 'old' ? waterErrorId : undefined}
                      onChange={value => changeReading(roomId, 'oldWater', value)}
                    />
                    {water.invalidInput === 'old' && (
                      <p id={waterErrorId} className="mt-1 text-xs text-status-danger">
                        {water.error}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <ReadingInput
                      label={`Nước mới phòng ${room.roomNumber}`}
                      value={newWater}
                      errorId={water.invalidInput === 'new' ? waterErrorId : undefined}
                      onChange={value => changeReading(roomId, 'newWater', value)}
                    />
                    {water.invalidInput === 'new' && (
                      <p id={waterErrorId} className="mt-1 text-xs text-status-danger">
                        {water.error}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-4 font-bold tabular-nums">
                    {water.used === null ? '—' : formatNumber.format(water.used)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${statusColor}`}
                    >
                      {readingStatus}
                    </span>
                    <button
                      type="button"
                      aria-expanded={previewOpen}
                      aria-controls={previewOpen ? `utility-preview-${roomId}` : undefined}
                      aria-label={`${previewOpen ? 'Ẩn tạm tính' : 'Xem tạm tính'} phòng ${room.roomNumber}`}
                      onClick={() => setPreviewRoomId(previewOpen ? '' : roomId)}
                      className="mt-2 flex items-center gap-1 whitespace-nowrap text-xs font-bold text-primary-dark hover:underline"
                    >
                      {previewOpen ? 'Ẩn tạm tính' : 'Xem tạm tính'}
                      {previewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {reading.isRecorded && (
                      <Link
                        to={{
                          pathname: '/invoices/new',
                          search: new URLSearchParams({ propertyId, roomId, billingMonth }).toString(),
                        }}
                        aria-label={`Lập hóa đơn phòng ${room.roomNumber}`}
                        className="mt-2 inline-block whitespace-nowrap text-xs font-bold text-primary-dark hover:underline"
                      >
                        Lập hóa đơn
                      </Link>
                    )}
                  </td>
                </tr>
                {previewOpen && (
                  <tr id={`utility-preview-${roomId}`}>
                    <td colSpan={8} className="px-3 pb-3">
                      <UtilityEstimate
                        roomNumber={room.roomNumber}
                        electricityUsed={electricity.used}
                        waterUsed={water.used}
                        rate={getUtilityRate(
                          room,
                          contracts,
                          propertyRate,
                          billingMonth,
                          rateError,
                        )}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
