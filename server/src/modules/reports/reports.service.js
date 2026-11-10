import Users from '../../models/Users.js';
import Properties from '../../models/Properties.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import Rooms from '../../models/Rooms.js';
import Contracts from '../../models/Contracts.js';
import RentalRequests from '../../models/RentalRequests.js';
import TerminationRequests from '../../models/TerminationRequests.js';
import Invoices from '../../models/Invoices.js';
import Payments from '../../models/Payments.js';

export const getReports = async (userId, { propertyId, month }) => {
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
  const selectedProperties = propertyId
    ? properties.filter(property => String(property._id) === propertyId)
    : properties;
  // Kỳ báo cáo tính theo giờ Việt Nam, đầu tháng bao gồm, đầu tháng sau không bao gồm.
  const [year, monthNumber] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, monthNumber - 1, 1) - 7 * 3600000);
  const end = new Date(Date.UTC(year, monthNumber, 1) - 7 * 3600000);
  const period = { $gte: start, $lt: end };
  const now = new Date();
  const rows = [];
  for (const property of selectedProperties) {
    const rooms = await Rooms.find({ property: property._id })
      .select('status statusHistory createdAt')
      .lean();
    const roomIds = rooms.map(room => room._id);
    const contractIds = await Contracts.distinct('_id', { room: { $in: roomIds } });
    const invoiceIds = await Invoices.distinct('_id', {
      contract: { $in: contractIds }, invoiceType: { $ne: 'deposit' },
    });
    const [activeContracts, newContracts, rentalRequests, checkoutRequests, invoices, payments] =
      await Promise.all([
        Contracts.countDocuments({
          _id: { $in: contractIds },
          status: 'active',
          startDate: { $lte: now },
          endDate: { $gte: now },
        }),
        Contracts.countDocuments({ _id: { $in: contractIds }, createdAt: period }),
        RentalRequests.countDocuments({ room: { $in: roomIds }, createdAt: period }),
        TerminationRequests.countDocuments({ contract: { $in: contractIds }, createdAt: period }),
        Invoices.find({
          contract: { $in: contractIds },
          billingMonth: month,
          status: { $ne: 'cancelled' },
        })
          .select('totalAmount paidAmount dueDate')
          .lean(),
        Payments.find({ invoice: { $in: invoiceIds }, status: 'success', paidAt: period })
          .select('amount')
          .lean(),
      ]);
    const occupied = rooms.filter(room => room.status === 'occupied').length;
    const cutoff = end > now ? now : new Date(end.getTime() - 1);
    const historicalRooms = rooms.filter(room => room.createdAt <= cutoff);
    const snapshot = { available: 0, occupied: 0, maintenance: 0, reserved: 0, unknown: 0 };
    for (const room of historicalRooms) {
      const last = (room.statusHistory || [])
        .filter(event => event.at <= cutoff)
        .sort((a, b) => b.at - a.at)[0];
      if (last) snapshot[last.status]++;
      else snapshot.unknown++;
    }
    rows.push({
      propertyId: String(property._id),
      historicalOccupied: snapshot.occupied,
      historicalAvailable: snapshot.available,
      historicalMaintenance: snapshot.maintenance,
      historicalReserved: snapshot.reserved,
      historicalUnknown: snapshot.unknown,
      historyAsOf: cutoff,
      name: property.name,
      rooms: rooms.length,
      occupied,
      available: rooms.filter(room => room.status === 'available').length,
      occupancyRate: rooms.length ? Math.round((occupied / rooms.length) * 1000) / 10 : 0,
      activeContracts,
      newContracts,
      rentalRequests,
      checkoutRequests,
      invoiced: invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0),
      outstanding: invoices.reduce(
        (sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount),
        0,
      ),
      overdue: invoices.reduce(
        (sum, invoice) =>
          sum + (invoice.dueDate < now ? Math.max(0, invoice.totalAmount - invoice.paidAmount) : 0),
        0,
      ),
      received: payments.reduce((sum, payment) => sum + payment.amount, 0),
      invoiceCount: invoices.length,
      paymentCount: payments.length,
    });
  }
  return { properties, rows, month, generatedAt: now };
};
