import Room from '../entities/Room.js';
import Contract from '../entities/Contract.js';
import UtilityReading from '../entities/UtilityReading.js';
import UtilityRate from '../entities/UtilityRate.js';
import Invoice from '../entities/Invoice.js';

export class BillingDAO {
  findRoom(id, user) {
    return Room.findOne({
      _id: id,
      [user.role === 'LANDLORD' ? 'owner' : 'manager']: user.id,
    }).lean();
  }
  activeContract(room, start, end) {
    return Contract.findOne({
      room,
      status: { $in: ['APPROVED', 'ACTIVE'] },
      startDate: { $lt: end },
      endDate: { $gte: start },
    }).lean();
  }
  saveReading(data) {
    return UtilityReading.create(data);
  }
  reading(room, period) {
    return UtilityReading.findOne({ room, period }).lean();
  }
  rate(building, date) {
    return UtilityRate.findOne({ building, effectiveFrom: { $lte: date } })
      .sort({ effectiveFrom: -1 })
      .lean();
  }
  createInvoice(data) {
    return Invoice.create(data);
  }
  invoiceExists(contract, period) {
    return Invoice.exists({ contract, period });
  }
}
