import { AppError } from '../utils/errors.js';

const validPeriod = value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '');
const quantity = (value, label) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0)
    throw new AppError(`${label} must be zero or greater.`);
  return number;
};

export class BillingService {
  constructor(dao) {
    this.dao = dao;
  }
  authorize(user) {
    if (!['LANDLORD', 'MANAGER'].includes(user?.role))
      throw new AppError('Only landlords and managers can bill rooms.', 403);
  }
  async room(id, user) {
    this.authorize(user);
    const room = await this.dao.findRoom(id, user);
    if (!room) throw new AppError('Room not found.', 404);
    return room;
  }
  async recordReading(body, user) {
    const room = await this.room(body.room, user);
    if (!validPeriod(body.period)) throw new AppError('Use a month in YYYY-MM format.');
    const values = {
      electricityPrevious: quantity(body.electricityPrevious, 'Previous electricity reading'),
      electricityCurrent: quantity(body.electricityCurrent, 'Current electricity reading'),
      waterPrevious: quantity(body.waterPrevious, 'Previous water reading'),
      waterCurrent: quantity(body.waterCurrent, 'Current water reading'),
    };
    if (
      values.electricityCurrent < values.electricityPrevious ||
      values.waterCurrent < values.waterPrevious
    )
      throw new AppError('Current meter readings cannot be lower than previous readings.');
    const [year, month] = body.period.split('-').map(Number);
    const start = new Date(year, month - 1, 1),
      end = new Date(year, month, 1);
    const contract = await this.dao.activeContract(room._id, start, end);
    if (!contract) throw new AppError('There is no active contract for this room and month.', 409);
    try {
      return await this.dao.saveReading({
        room: room._id,
        contract: contract._id,
        period: body.period,
        ...values,
        recordedBy: user.id,
      });
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('A reading already exists for this room and month.', 409);
      throw error;
    }
  }
  async createInvoice(body, user) {
    const room = await this.room(body.room, user);
    if (!validPeriod(body.period)) throw new AppError('Use a month in YYYY-MM format.');
    const [year, month] = body.period.split('-').map(Number);
    const start = new Date(year, month - 1, 1),
      end = new Date(year, month, 1);
    const contract = await this.dao.activeContract(room._id, start, end);
    if (!contract) throw new AppError('There is no active contract for this room and month.', 409);
    if (await this.dao.invoiceExists(contract._id, body.period))
      throw new AppError('An invoice already exists for this contract and month.', 409);
    const reading = await this.dao.reading(room._id, body.period);
    if (!reading) throw new AppError('Record electricity and water readings first.', 409);
    const rate = await this.dao.rate(contract.building, new Date(end.getTime() - 1));
    if (!rate)
      throw new AppError('Add a utility rate that is effective for this month first.', 409);
    const electricity = reading.electricityCurrent - reading.electricityPrevious;
    const water = reading.waterCurrent - reading.waterPrevious;
    const lines = [
      {
        description: 'Monthly rent',
        kind: 'RENT',
        quantity: 1,
        unitPrice: contract.rent,
        amount: contract.rent,
      },
      {
        description: 'Electricity',
        kind: 'ELECTRICITY',
        quantity: electricity,
        unitPrice: rate.electricityPrice,
        amount: Math.round(electricity * rate.electricityPrice),
      },
      {
        description: 'Water',
        kind: 'WATER',
        quantity: water,
        unitPrice: rate.waterPrice,
        amount: Math.round(water * rate.waterPrice),
      },
    ];
    const usage = body.serviceUsage || {};
    const people = contract.occupantCount || Math.max(1, contract.occupants?.length || 1);
    for (const fee of contract.feesSnapshot || []) {
      const count =
        fee.unit === 'MONTH'
          ? 1
          : fee.unit === 'PERSON'
            ? people
            : quantity(usage[fee.code], fee.name);
      const amount = Math.round(count * fee.price);
      lines.push({
        description: fee.unit === 'USAGE' ? `${fee.name} (${fee.usageUnit})` : fee.name,
        kind: 'SERVICE',
        quantity: count,
        unitPrice: fee.price,
        amount,
      });
    }
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    if (!Number.isSafeInteger(total)) throw new AppError('Invoice total is too large.');
    const dueDay = Math.min(31, contract.policySnapshot?.paymentDueDay || 5);
    const lastDay = new Date(year, month, 0).getDate();
    const dueDate = new Date(year, month - 1, Math.min(dueDay, lastDay));
    try {
      return await this.dao.createInvoice({
        code: `INV-${year}${String(month).padStart(2, '0')}-${String(contract._id).slice(-6)}`,
        contract: contract._id,
        room: room._id,
        building: contract.building,
        tenant: contract.tenant,
        period: body.period,
        reading: reading._id,
        lines,
        total,
        dueDate,
        status: 'ISSUED',
        issuedAt: new Date(),
        createdBy: user.id,
      });
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('An invoice already exists for this contract and month.', 409);
      throw error;
    }
  }
}
