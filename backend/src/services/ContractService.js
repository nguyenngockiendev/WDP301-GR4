import { AppError } from '../utils/errors.js';
import Room from '../entities/Room.js';
import User from '../entities/User.js';
import Building from '../entities/Building.js';
import Contract from '../entities/Contract.js';
import RentRate from '../entities/RentRate.js';
import ServiceFee from '../entities/ServiceFee.js';
import ContractPolicy from '../entities/ContractPolicy.js';

const validId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const asDate = value => {
  const date =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError('Enter valid contract dates.');
  return date;
};

export class ContractService {
  async options(user) {
    if (user.role !== 'LANDLORD') throw new AppError('Only landlords can create contracts.', 403);
    const rooms = await Room.find({ owner: user.id, status: 'VACANT' }).sort({ title: 1 }).lean();
    const tenants = await User.find({ role: 'TENANT', active: true })
      .sort({ name: 1 })
      .select('name email')
      .lean();
    return { rooms, tenants };
  }

  async create(body, user) {
    if (user.role !== 'LANDLORD') throw new AppError('Only landlords can create contracts.', 403);
    if (!validId(body.room) || !validId(body.tenant))
      throw new AppError('Choose a room and tenant.');
    const [room, tenant] = await Promise.all([
      Room.findOne({ _id: body.room, owner: user.id }).lean(),
      User.findOne({ _id: body.tenant, role: 'TENANT', active: true }).lean(),
    ]);
    if (!room || room.status !== 'VACANT') throw new AppError('The room is not available.', 409);
    if (!tenant) throw new AppError('Tenant account not found.');
    if (!room.building)
      throw new AppError('Assign this room to a building before creating a contract.');
    const building = await Building.findOne({
      _id: room.building,
      owner: user.id,
      status: 'ACTIVE',
    }).lean();
    if (!building) throw new AppError('The room must belong to an active building.');
    const startDate = asDate(body.startDate),
      endDate = asDate(body.endDate);
    if (endDate <= startDate) throw new AppError('The end date must be after the start date.');
    if (startDate > new Date()) throw new AppError('Contracts can start today or earlier.');
    if (endDate <= new Date()) throw new AppError('The end date must be in the future.');
    const [rentRate, policy, fees] = await Promise.all([
      RentRate.findOne({ room: room._id, effectiveFrom: { $lte: startDate } })
        .sort({ effectiveFrom: -1 })
        .lean(),
      ContractPolicy.findOne({ building: building._id }).sort({ version: -1 }).lean(),
      ServiceFee.find({ building: building._id, active: true }).sort({ name: 1 }).lean(),
    ]);
    const rent = rentRate?.amount ?? room.price;
    let months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      endDate.getMonth() -
      startDate.getMonth();
    const lastDayOfEndMonth = new Date(
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      0,
    ).getDate();
    if (endDate.getDate() < startDate.getDate() && endDate.getDate() < lastDayOfEndMonth)
      months -= 1;
    if (policy && months < policy.minMonths)
      throw new AppError(`Minimum rental term is ${policy.minMonths} months.`);
    const deposit = Number(body.deposit);
    if (!Number.isSafeInteger(deposit) || deposit < 0 || deposit > 1000000000)
      throw new AppError('Deposit must be a whole VND amount between 0 and 1 billion.');
    const occupantCount = Number(body.occupantCount || 1);
    if (
      !Number.isInteger(occupantCount) ||
      occupantCount < 1 ||
      occupantCount > (room.capacity || 1)
    )
      throw new AppError(`Occupants must be from 1 to ${room.capacity || 1}.`);
    try {
      const contract = await Contract.create({
        code: `HD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        room: room._id,
        building: building._id,
        tenant: tenant._id,
        occupants: [tenant._id],
        occupantCount,
        startDate,
        endDate,
        rent,
        deposit,
        status: 'ACTIVE',
        policySnapshot: policy && {
          version: policy.version,
          minMonths: policy.minMonths,
          terms: policy.terms,
          noticeDays: policy.noticeDays,
          paymentDueDay: policy.paymentDueDay,
          paymentGraceDays: policy.paymentGraceDays,
        },
        feesSnapshot: fees.map(({ code, name, unit, usageUnit, price }) => ({
          code,
          name,
          unit,
          usageUnit,
          price,
        })),
        createdBy: user.id,
      });
      await Room.updateOne({ _id: room._id }, { $set: { status: 'OCCUPIED' } });
      return contract;
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('This room already has an active contract.', 409);
      throw error;
    }
  }
}
