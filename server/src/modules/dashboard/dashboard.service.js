import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import RentalRequests from '../../models/RentalRequests.js';
import Users from '../../models/Users.js';
import TerminationRequests from '../../models/TerminationRequests.js';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';
import { getMyInvoices } from '../invoices/invoices.service.js';

export const getDashboard = async (user, { propertyId, days = 30 } = {}) => {
  // Lấy vai trò từ DB để tài khoản bị khóa hoặc đổi quyền có hiệu lực ngay.
  const account = await Users.findById(user.userId).select('fullName role status').lean();
  if (!account || account.status !== 'active') {
    throw { status: 401, message: 'Tài khoản không tồn tại hoặc đã bị khóa.' };
  }
  const identity = { userId: String(account._id), fullName: account.fullName, role: account.role };
  const now = new Date();
  if (identity.role === 'tenant') {
    if (propertyId) {
      throw { status: 400, message: 'Dashboard người thuê không dùng bộ lọc nhà trọ.' };
    }
    return getTenantDashboard(identity, now);
  }
  if (['landlord', 'manager'].includes(identity.role)) {
    return getManagedDashboard(identity, propertyId, days, now);
  }
  throw { status: 403, message: 'Bạn không có quyền xem dashboard.' };
};

// Phòng đang thuê, hóa đơn cần trả và các yêu cầu của người thuê.
const getTenantDashboard = async (user, now) => {
  const invoices = await getMyInvoices(user.userId);
  const payableInvoices = invoices.filter(
    invoice =>
      invoice.canPay &&
      ['unpaid', 'partially_paid', 'overdue'].includes(invoice.status) &&
      invoice.totalAmount > invoice.paidAmount,
  );
  const recentPayments = await Payments.find({ payer: user.userId, status: 'success' })
    .select('invoice amount paidAt method')
    .sort({ paidAt: -1, _id: -1 })
    .limit(5)
    .lean();
  const contracts = await Contracts.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [{ representative: user.userId }, { otherMembers: user.userId }],
  })
    .select('room startDate endDate monthlyRent depositAmount representative otherMembers status')
    .populate({
      path: 'room',
      select: 'roomNumber area maxTenants property',
      populate: { path: 'property', select: 'name address' },
    })
    .sort({ endDate: 1 })
    .lean();
  const [rentalRequestCount, checkoutRequestCount] = await Promise.all([
    RentalRequests.countDocuments({ tenant: user.userId, status: 'pending' }),
    TerminationRequests.countDocuments({ requestedBy: user.userId, status: 'pending' }),
  ]);
  return {
    finance: {
      outstanding: payableInvoices.reduce(
        (sum, invoice) => sum + invoice.totalAmount - invoice.paidAmount,
        0,
      ),
      unpaidCount: payableInvoices.length,
      invoices: payableInvoices
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5)
        .map(invoice => ({
          _id: invoice._id,
          billingMonth: invoice.billingMonth,
          dueDate: invoice.dueDate,
          balance: invoice.totalAmount - invoice.paidAmount,
        })),
      recentPayments,
    },
    rentalRequestCount,
    checkoutRequestCount,
    user,
    generatedAt: now,
    contracts: contracts.map(({ representative, otherMembers, ...contract }) => ({
      ...contract,
      isRepresentative: String(representative) === String(user.userId),
      memberCount: new Set([representative, ...otherMembers].map(String)).size,
    })),
  };
};

// Tổng quan dãy trọ được phép quản lý.
const getManagedDashboard = async (user, propertyId, days, now) => {
  const until = new Date(now.getTime() + days * 86400000);
  const properties = await getDashboardProperties(user, propertyId);
  if (!propertyId && properties.length) propertyId = String(properties[0]._id);
  const rooms = await Rooms.find({
    property: { $in: propertyId ? [propertyId] : properties.map(item => item._id) },
  })
    .select('_id status')
    .lean();
  const roomIds = rooms.map(room => room._id);
  const contractIds = await Contracts.distinct('_id', { room: { $in: roomIds } });
  const revenue = await getRevenue(contractIds, now);
  const checkoutRequestCount = await TerminationRequests.countDocuments({
    contract: { $in: contractIds },
    status: 'pending',
  });
  const statuses = { available: 0, occupied: 0, maintenance: 0, reserved: 0 };
  rooms.forEach(room => {
    if (room.status in statuses) statuses[room.status]++;
  });
  const active = {
    room: { $in: roomIds },
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  };
  const expiring = { ...active, endDate: { $gte: now, $lte: until } };
  const pending = { room: { $in: roomIds }, status: 'pending' };
  const [activeContracts, expiringCount, expiringContracts, pendingCount, pendingRequests] =
    await Promise.all([
      Contracts.countDocuments(active),
      Contracts.countDocuments(expiring),
      Contracts.find(expiring)
        .select('room representative startDate endDate monthlyRent')
        .populate('room', 'roomNumber property price')
        .populate('representative', 'fullName')
        .sort({ endDate: 1, _id: 1 })
        .limit(10)
        .lean(),
      RentalRequests.countDocuments(pending),
      RentalRequests.find(pending)
        .select('room tenant expectedDate createdAt')
        .populate('room', 'roomNumber property')
        .populate('tenant', 'fullName')
        .sort({ createdAt: -1, _id: -1 })
        .limit(10)
        .lean(),
    ]);
  return {
    user,
    properties,
    selectedPropertyId: propertyId || '',
    revenue,
    utilityRate: properties.find(item => String(item._id) === propertyId)?.utilityRate || null,
    days,
    generatedAt: now,
    roomStats: {
      total: rooms.length,
      ...statuses,
      occupancyRate: rooms.length ? Math.round((statuses.occupied / rooms.length) * 1000) / 10 : 0,
    },
    activeContracts,
    checkoutRequestCount,
    expiringCount,
    expiringContracts,
    pendingCount,
    pendingRequests,
  };
};

const getDashboardProperties = async (user, propertyId) => {
  let propertyFilter;
  if (user.role === 'landlord') {
    propertyFilter = { owner: user.userId };
  } else {
    const assignedPropertyIds = await ManagerAssignments.distinct('property', {
      manager: user.userId,
      status: 'active',
    });
    propertyFilter = { _id: { $in: assignedPropertyIds } };
  }
  const properties = await Properties.find(propertyFilter)
    .select('name address utilityRate')
    .sort({ name: 1 })
    .lean();
  if (propertyId && !properties.some(item => String(item._id) === propertyId)) {
    throw { status: 403, message: 'Bạn không được phép xem nhà trọ này.' };
  }
  return properties;
};

// Thu tiền thành công trong sáu tháng gần nhất, theo giờ Việt Nam.
const getRevenue = async (contractIds, now) => {
  const invoiceIds = await Invoices.distinct('_id', { contract: { $in: contractIds } });
  const vietnamNow = new Date(now.getTime() + 7 * 3600000);
  const year = vietnamNow.getUTCFullYear();
  const month = vietnamNow.getUTCMonth();
  const revenueStart = new Date(Date.UTC(year, month - 5, 1) - 7 * 3600000);
  const monthlyPayments = await Payments.aggregate([
    {
      $match: {
        invoice: { $in: invoiceIds },
        status: 'success',
        paidAt: { $gte: revenueStart, $lte: now },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$paidAt', timezone: 'Asia/Ho_Chi_Minh' } },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  const revenue = Array.from({ length: 6 }, (_, index) => {
    const key = new Date(Date.UTC(year, month - 5 + index, 1)).toISOString().slice(0, 7);
    const payment = monthlyPayments.find(item => item._id === key);
    return { month: key, amount: payment?.amount || 0, count: payment?.count || 0 };
  });
  return revenue;
};
