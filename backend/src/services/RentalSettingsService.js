import { AppError } from '../utils/errors.js';

const allowedKinds = ['rates', 'fees', 'policies'];
const validId = id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
const requiredText = (value, name, max = 20000) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new AppError(`${name} is required and must be at most ${max} characters.`);
  return value.trim();
};
const integer = (value, name, min, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max)
    throw new AppError(`${name} must be a whole number from ${min} to ${max}.`);
  return number;
};

export class RentalSettingsService {
  constructor(dao, buildingService) {
    this.dao = dao;
    this.buildingService = buildingService;
  }

  async building(kind, buildingId, user) {
    if (!allowedKinds.includes(kind)) throw new AppError('Settings category not found.', 404);
    if (!validId(buildingId)) throw new AppError('Please select a valid boarding house.');
    return this.buildingService.detail(buildingId, user);
  }

  async list(kind, buildingId, user) {
    await this.building(kind, buildingId, user);
    return this.dao.list(kind, buildingId);
  }

  async values(kind, body, buildingId, user) {
    const building = await this.building(kind, buildingId, user);
    if (kind === 'rates') {
      const effectiveFrom = new Date(body.effectiveFrom);
      if (Number.isNaN(effectiveFrom.getTime()))
        throw new AppError('Enter a valid effective date.');
      return {
        building: building._id,
        effectiveFrom,
        electricityPrice: integer(body.electricityPrice, 'Electricity price', 0),
        waterPrice: integer(body.waterPrice, 'Water price', 0),
        createdBy: user.id,
      };
    }
    if (kind === 'fees') {
      const unit = body.unit;
      if (!['MONTH', 'PERSON', 'USAGE'].includes(unit))
        throw new AppError('Select a valid fee unit.');
      return {
        building: building._id,
        code: requiredText(body.code, 'Fee code', 50).toUpperCase(),
        name: requiredText(body.name, 'Fee name', 200),
        unit,
        usageUnit: unit === 'USAGE' ? requiredText(body.usageUnit, 'Usage unit', 30) : '',
        price: integer(body.price, 'Fee price', 0),
        active: body.active !== false && body.active !== 'false',
      };
    }
    return {
      building: building._id,
      minMonths: integer(body.minMonths, 'Minimum rental term', 1, 120),
      noticeDays: integer(body.noticeDays, 'Notice period', 0, 365),
      paymentDueDay: integer(body.paymentDueDay, 'Payment due day', 1, 31),
      paymentGraceDays: integer(body.paymentGraceDays, 'Payment grace period', 0, 31),
      terms: requiredText(body.terms, 'Contract terms'),
      createdBy: user.id,
    };
  }

  async create(kind, body, user) {
    const data = await this.values(kind, body, body.building, user);
    if (kind === 'policies') {
      const latest = await this.dao.latestPolicyVersion(body.building);
      data.version = (latest?.version || 0) + 1;
    }
    try {
      return await this.dao.create(kind, data);
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('A setting already exists for this code or effective date.', 409);
      throw error;
    }
  }

  async update(kind, id, body, user) {
    if (!allowedKinds.includes(kind)) throw new AppError('Settings category not found.', 404);
    if (!validId(id)) throw new AppError('Setting not found.', 404);
    const current = await this.dao.find(kind, id);
    if (!current) throw new AppError('Setting not found.', 404);
    await this.building(kind, String(current.building), user);
    if (kind !== 'fees')
      throw new AppError(
        'Utility rates and contract policies are versioned. Create a new record to change them.',
        409,
      );
    const data = await this.values(kind, { ...current, ...body }, String(current.building), user);
    try {
      return await this.dao.update(kind, id, data);
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('A setting already exists for this code or effective date.', 409);
      throw error;
    }
  }
}
