import mongoose from 'mongoose';
import { AppError } from '../../shared/utils/errors.js';

const validMonth = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');

export class ReportService {
  constructor(dao) {
    this.dao = dao;
  }
  async summary(user, query = {}) {
    if (!['LANDLORD', 'MANAGER'].includes(user?.role))
      throw new AppError('You do not have access to business reports.', 403);

    const from = query.from || '';
    const to = query.to || '';
    if ((from && !validMonth(from)) || (to && !validMonth(to)))
      throw new AppError('Choose a valid reporting month.');
    if (from && to && from > to) throw new AppError('Start month must not be after end month.');

    const uid = new mongoose.Types.ObjectId(user.id);
    const roomFilter = user.role === 'LANDLORD'
      ? { $or: [{ owner: uid }, { building: { $in: await this.dao.ids('Building', { owner: uid }) } }] }
      : { manager: uid };
    const roomIds = await this.dao.ids('Room', roomFilter);
    const invoiceFilter = {
      room: { $in: roomIds },
      status: { $in: ['ISSUED', 'PARTIAL', 'PAID', 'unpaid', 'partially_paid', 'paid', 'overdue'] },
    };
    if (from || to) {
      const period = {};
      if (from) period.$gte = from;
      if (to) period.$lte = to;
      invoiceFilter.$or = [{ period }, { billingMonth: period }];
    }

    const [billed, paid, total, occupied, vacant, maintenance] = await Promise.all([
      this.dao.sum('Invoice', invoiceFilter, 'totalAmount'),
      this.dao.sum('Invoice', invoiceFilter, 'paidAmount'),
      this.dao.count('Room', roomFilter),
      this.dao.count('Room', { ...roomFilter, status: { $in: ['OCCUPIED', 'occupied'] } }),
      this.dao.count('Room', { ...roomFilter, status: { $in: ['VACANT', 'available'] } }),
      this.dao.count('Room', { ...roomFilter, status: 'MAINTENANCE' }),
    ]);
    return {
      from: from || null,
      to: to || null,
      billed,
      outstandingBalance: Math.max(0, billed - paid),
      revenue: paid,
      occupancy: { total, occupied, vacant, maintenance },
    };
  }
}
