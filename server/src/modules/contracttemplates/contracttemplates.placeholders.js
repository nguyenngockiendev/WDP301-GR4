/**
 * Các biến (placeholder) dùng trong nội dung mẫu hợp đồng.
 * Chủ trọ viết {{tenBien}} trong mẫu, khi xem hợp đồng hệ thống sẽ thay bằng dữ liệu thật.
 */
export const TEMPLATE_PLACEHOLDERS = [
  { key: 'landlordName', label: 'Tên chủ trọ' },
  { key: 'landlordPhone', label: 'SĐT chủ trọ' },
  { key: 'propertyName', label: 'Tên nhà trọ' },
  { key: 'propertyAddress', label: 'Địa chỉ nhà trọ' },
  { key: 'roomNumber', label: 'Số phòng' },
  { key: 'roomArea', label: 'Diện tích phòng (m²)' },
  { key: 'tenantName', label: 'Tên người đại diện' },
  { key: 'tenantPhone', label: 'SĐT người đại diện' },
  { key: 'tenantEmail', label: 'Email người đại diện' },
  { key: 'otherMembers', label: 'Danh sách người ở cùng' },
  { key: 'memberCount', label: 'Tổng số người ở' },
  { key: 'startDate', label: 'Ngày bắt đầu' },
  { key: 'endDate', label: 'Ngày kết thúc' },
  { key: 'monthlyRent', label: 'Tiền thuê / tháng' },
  { key: 'depositAmount', label: 'Tiền đặt cọc' },
  { key: 'paymentDueDay', label: 'Ngày đóng tiền hằng tháng' },
  { key: 'electricityPrice', label: 'Giá điện (đ/kWh)' },
  { key: 'waterPrice', label: 'Giá nước (đ/m³)' },
  { key: 'createdByName', label: 'Người lập hợp đồng' },
  { key: 'today', label: 'Ngày lập văn bản' },
];

const PLACEHOLDER_KEYS = new Set(TEMPLATE_PLACEHOLDERS.map(p => p.key));
const PLACEHOLDER_REGEX = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

/** Các biến không hợp lệ (gõ sai tên) có trong nội dung mẫu. */
export const findUnknownPlaceholders = content => {
  const unknown = new Set();
  for (const match of String(content || '').matchAll(PLACEHOLDER_REGEX)) {
    if (!PLACEHOLDER_KEYS.has(match[1])) unknown.add(match[1]);
  }
  return [...unknown];
};

const formatDate = d => (d ? new Date(d).toLocaleDateString('vi-VN') : '');
const formatMoney = n => `${Number(n || 0).toLocaleString('vi-VN')} đồng`;

/** Dựng bộ giá trị cho các biến từ hợp đồng đã populate (room.property.owner, representative, otherMembers, createdBy). */
export const buildPlaceholderValues = contract => {
  const room = contract.room || {};
  const property = room.property || {};
  const owner = property.owner || {};
  const rep = contract.representative || {};
  const members = contract.otherMembers || [];

  return {
    landlordName: owner.fullName || '',
    landlordPhone: owner.phone || '',
    propertyName: property.name || '',
    propertyAddress: property.address || '',
    roomNumber: room.roomNumber || '',
    roomArea: room.area != null ? String(room.area) : '',
    tenantName: rep.fullName || '',
    tenantPhone: rep.phone || '',
    tenantEmail: rep.email || '',
    otherMembers: members.length
      ? members.map((m, i) => `${i + 1}. ${m.fullName || ''}${m.phone ? ` - ${m.phone}` : ''}`).join('\n')
      : 'Không có',
    memberCount: String(1 + members.length),
    startDate: formatDate(contract.startDate),
    endDate: formatDate(contract.endDate),
    monthlyRent: formatMoney(contract.monthlyRent),
    depositAmount: formatMoney(contract.depositAmount),
    paymentDueDay: property.contractPolicy?.paymentDueDay != null ? String(property.contractPolicy.paymentDueDay) : '',
    electricityPrice: property.utilityRate?.electricityPrice != null ? Number(property.utilityRate.electricityPrice).toLocaleString('vi-VN') : '',
    waterPrice: property.utilityRate?.waterPrice != null ? Number(property.utilityRate.waterPrice).toLocaleString('vi-VN') : '',
    createdByName: contract.createdBy?.fullName || '',
    today: formatDate(new Date()),
  };
};

/** Thay các {{bien}} trong nội dung bằng giá trị; biến không có giá trị để trống. */
export const fillTemplate = (content, values) =>
  String(content || '').replace(PLACEHOLDER_REGEX, (whole, key) =>
    PLACEHOLDER_KEYS.has(key) ? values[key] ?? '' : whole,
  );
