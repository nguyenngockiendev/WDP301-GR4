import { AppError } from '../utils/errors.js';

export class ReportService {
  constructor(dao) {
    this.dao = dao;
  }
  async summary(user) {
    if (user?.role !== 'LANDLORD')
      throw new AppError('Only landlords can view business reports.', 403);
    const issued = { status: { $in: ['ISSUED', 'PARTIAL', 'PAID'] } };
    const [billed, paid, total, occupied, vacant, maintenance] = await Promise.all([
      this.dao.sum('Invoice', issued, 'total'),
      this.dao.sum('Invoice', issued, 'paidAmount'),
      this.dao.count('Room', {}),
      this.dao.count('Room', { status: 'OCCUPIED' }),
      this.dao.count('Room', { status: 'VACANT' }),
      this.dao.count('Room', { status: 'MAINTENANCE' }),
    ]);
    return {
      outstandingBalance: Math.max(0, billed - paid),
      revenue: paid,
      occupancy: { total, occupied, vacant, maintenance },
    };
  }
}
