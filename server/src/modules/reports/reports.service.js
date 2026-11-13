import UtilityReadings from '../../models/UtilityReadings.js';
import Users from '../../models/Users.js';
import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';

export const getReports = async (userId, { propertyId, month }) => {
  const properties = await getReportProperties(userId, propertyId);
  const selectedProperties = propertyId
    ? properties.filter(property => String(property._id) === propertyId)
    : properties;
  // Kỳ báo cáo tính theo giờ Việt Nam, đầu tháng bao gồm, đầu tháng sau không bao gồm.
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1) - 7 * 3600000);
  const end = new Date(Date.UTC(year, monthNumber, 1) - 7 * 3600000);
  const now = new Date();
  if (start > now) throw { status: 400, message: 'Chưa có dữ liệu cho tháng tương lai.' };
  const cutoff = end > now ? now : new Date(end.getTime() - 1);

  const rows = [];
  for (const property of selectedProperties) {
    const rooms = await Rooms.find({ property: property._id })
      .select('status roomNumber name floor area price createdAt')
      .sort({ roomNumber: 1 })
      .lean();
    const roomIds = rooms.map(room => room._id);
    const finance = await getFinanceReport(roomIds, month, start, cutoff);
    const utilities = await getUtilityReport(roomIds, month);
    const occupancy = await getMonthlyOccupancy(rooms, start, end, cutoff);
    const revenue = await getPaidRevenue(roomIds, month);
    const occupied = rooms.filter(room => room.status === 'occupied').length;

    rows.push({
      propertyId: String(property._id),
      name: property.name,
      rooms: rooms.length,
      occupied,
      available: rooms.filter(room => room.status === 'available').length,
      occupancyRate: rooms.length ? Math.round((occupied / rooms.length) * 1000) / 10 : 0,
      monthly: { ...occupancy, ...revenue },
      ...finance,
      ...utilities,
    });
  }
  return { properties, rows, month, generatedAt: now, asOf: cutoff, provisional: end > now };
};

// Phòng đang cho thuê trong tháng: có hợp đồng (không phải nháp) giao với kỳ báo cáo.
// Hợp đồng đã thanh lý coi như kết thúc tại lần cập nhật cuối nếu sớm hơn ngày hết hạn.
const getMonthlyOccupancy = async (rooms, start, end, cutoff) => {
  const periodRooms = rooms.filter(room => !room.createdAt || room.createdAt < end);
  const contracts = await Contracts.find({
    room: { $in: periodRooms.map(room => room._id) },
    status: { $in: ['active', 'expired', 'terminated'] },
    startDate: { $lt: end },
    endDate: { $gte: start },
  })
    .select('room status startDate endDate updatedAt monthlyRent')
    .lean();
  const rentedRoomIds = new Set(
    contracts
      .filter(contract => {
        const effectiveEnd =
          contract.status === 'terminated' && contract.updatedAt < contract.endDate
            ? contract.updatedAt
            : contract.endDate;
        return effectiveEnd >= start && contract.startDate <= cutoff;
      })
      .map(contract => String(contract.room)),
  );
  const vacantRooms = periodRooms
    .filter(room => !rentedRoomIds.has(String(room._id)))
    .map(room => ({
      _id: String(room._id),
      roomNumber: room.roomNumber,
      name: room.name || '',
      floor: room.floor,
      area: room.area,
      price: room.price,
      currentStatus: room.status,
    }));
  const total = periodRooms.length;
  const rented = total - vacantRooms.length;
  return {
    totalRooms: total,
    rentedRooms: rented,
    vacantRooms: vacantRooms.length,
    occupancyRate: total ? Math.round((rented / total) * 1000) / 10 : 0,
    vacantRoomList: vacantRooms,
  };
};

// Doanh thu tháng: tổng hóa đơn đã thanh toán đủ của kỳ (không gồm tiền cọc),
// kèm doanh thu 12 tháng trong năm để vẽ biểu đồ.
const getPaidRevenue = async (roomIds, month) => {
  const year = month.slice(0, 4);
  const contractIds = await Contracts.distinct('_id', { room: { $in: roomIds } });
  const invoices = await Invoices.find({
    contract: { $in: contractIds },
    invoiceType: { $ne: 'deposit' },
    status: 'paid',
    billingMonth: { $gte: `${year}-01`, $lte: `${year}-12` },
  })
    .select('billingMonth totalAmount')
    .lean();
  const revenueByMonth = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, '0')}`;
    const monthInvoices = invoices.filter(invoice => invoice.billingMonth === key);
    return {
      month: key,
      amount: monthInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      count: monthInvoices.length,
    };
  });
  const current = revenueByMonth.find(item => item.month === month);
  return {
    revenue: current.amount,
    paidInvoiceCount: current.count,
    yearRevenue: revenueByMonth.reduce((sum, item) => sum + item.amount, 0),
    revenueByMonth,
  };
};

// Chỉ lấy các dãy thuộc quyền xem báo cáo của tài khoản.
const getReportProperties = async (userId, propertyId) => {
  const user = await Users.findById(userId).select('role status').lean();
  if (!user || user.status !== 'active' || !['landlord', 'manager'].includes(user.role)) {
    throw { status: 403, message: 'Chỉ chủ trọ và quản lý được xem báo cáo.' };
  }
  let propertyFilter = { owner: userId };
  if (user.role === 'manager') {
    const ids = await ManagerAssignments.distinct('property', {
      manager: userId,
      status: 'active',
    });
    propertyFilter = { _id: { $in: ids } };
  }
  const properties = await Properties.find(propertyFilter).select('name').sort({ name: 1 }).lean();
  if (propertyId && !properties.some(property => String(property._id) === propertyId)) {
    throw { status: 403, message: 'Bạn không được xem nhà trọ này.' };
  }
  return properties;
};

// Thu tiền và công nợ theo kỳ đã chọn.
const getFinanceReport = async (roomIds, month, start, cutoff) => {
  const contractIds = await Contracts.distinct('_id', { room: { $in: roomIds } });
  const invoiceIds = await Invoices.distinct('_id', {
    contract: { $in: contractIds },
    invoiceType: { $ne: 'deposit' },
  });
  const [invoices, payments] = await Promise.all([
    Invoices.find({
      contract: { $in: contractIds },
      invoiceType: { $ne: 'deposit' },
      billingMonth: { $lte: month },
      createdAt: { $lte: cutoff },
      status: { $ne: 'cancelled' },
    })
      .select('billingMonth totalAmount dueDate updatedAt')
      .lean(),
    Payments.find({ invoice: { $in: invoiceIds }, status: 'success', paidAt: { $lte: cutoff } })
      .select('invoice amount paidAt method')
      .lean(),
  ]);

  const periodInvoices = invoices.filter(invoice => invoice.billingMonth === month);
  const periodPayments = payments.filter(payment => payment.paidAt >= start && payment.method !== 'checkout');
  // Tiền đã trả sau cuối kỳ không được trừ vào công nợ kỳ này.
  let openingBalance = 0;
  let outstanding = 0;
  let overdue = 0;
  for (const invoice of invoices) {
    const invoicePayments = payments.filter(
      payment => String(payment.invoice) === String(invoice._id),
    );
    const paidBefore = invoicePayments
      .filter(payment => payment.paidAt < start)
      .reduce((sum, payment) => sum + payment.amount, 0);
    const paidAtCutoff = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
    if (invoice.billingMonth < month)
      openingBalance += Math.max(0, invoice.totalAmount - paidBefore);
    const balance = Math.max(0, invoice.totalAmount - paidAtCutoff);
    outstanding += balance;
    if (invoice.dueDate < cutoff) overdue += balance;
  }
  return {
    openingBalance,
    invoiced: periodInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
    received: periodPayments.reduce((sum, payment) => sum + payment.amount, 0),
    outstanding,
    overdue,
    invoiceCount: periodInvoices.length,
    paymentCount: periodPayments.length,
  };
};

// Chỉ tính trung bình trên các phòng có chỉ số đúng trong kỳ.
const getUtilityReport = async (roomIds, month) => {
  const readings = await UtilityReadings.find({
    room: { $in: roomIds },
    billingMonth: month,
  }).lean();
  const electricityValues = readings
    .filter(
      reading =>
        Number.isFinite(reading.oldElectricity) &&
        Number.isFinite(reading.newElectricity) &&
        reading.oldElectricity >= 0 &&
        reading.newElectricity >= reading.oldElectricity,
    )
    .map(reading => reading.newElectricity - reading.oldElectricity);
  const waterValues = readings
    .filter(
      reading =>
        Number.isFinite(reading.oldWater) &&
        Number.isFinite(reading.newWater) &&
        reading.oldWater >= 0 &&
        reading.newWater >= reading.oldWater,
    )
    .map(reading => reading.newWater - reading.oldWater);
  const electricityTotal = electricityValues.reduce((sum, value) => sum + value, 0);
  const waterTotal = waterValues.reduce((sum, value) => sum + value, 0);
  return {
    electricityTotal,
    electricityRooms: electricityValues.length,
    electricityAverage: electricityValues.length
      ? electricityTotal / electricityValues.length
      : null,
    waterTotal,
    waterRooms: waterValues.length,
    waterAverage: waterValues.length ? waterTotal / waterValues.length : null,
  };
};
