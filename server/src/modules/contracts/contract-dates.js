const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export function getContractStartCutoff(now) {
  const vietnamDate = new Date(now.getTime() + VIETNAM_OFFSET_MS);
  // Ngày chọn từ form được lưu ở 00:00 UTC, dù ngày thuê bắt đầu theo giờ Việt Nam.
  const storedStartOfToday = vietnamDate.setUTCHours(0, 0, 0, 0);
  return new Date(Math.max(now.getTime(), storedStartOfToday));
}
