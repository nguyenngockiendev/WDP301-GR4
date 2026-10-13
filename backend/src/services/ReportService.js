import mongoose from 'mongoose';
import { AppError } from '../utils/errors.js';

export class ReportService {
  constructor(dao) {
    this.dao = dao;
  }
  async summary(user) {
    if (user?.role !== 'LANDLORD')
      throw new AppError('Only landlords can view business reports.', 403);
    const owner = new mongoose.Types.ObjectId(user.id);
    const buildingIds = await this.dao.ids('Building', { owner });
    const roomFilter = { $or: [{ owner }, { building: { $in: buildingIds } }] };
    const roomIds = await this.dao.ids('Room', roomFilter);
    const issued = { room: { $in: roomIds }, status: { $in: ['ISSUED', 'PARTIAL', 'PAID'] } };
    const [billed, paid, total, occupied, vacant, maintenance] = await Promise.all([
      this.dao.sum('Invoice', issued, 'total'),
      this.dao.sum('Invoice', issued, 'paidAmount'),
      this.dao.count('Room', roomFilter),
      this.dao.count('Room', { ...roomFilter, status: 'OCCUPIED' }),
      this.dao.count('Room', { ...roomFilter, status: 'VACANT' }),
      this.dao.count('Room', { ...roomFilter, status: 'MAINTENANCE' }),
    ]);
    return {
      outstandingBalance: Math.max(0, billed - paid),
      revenue: paid,
      occupancy: { total, occupied, vacant, maintenance },
    };
  }
}
