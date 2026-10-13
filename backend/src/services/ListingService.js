import { AppError } from '../utils/errors.js';
export class ListingService {
  constructor(dao, roles, userDAO, buildingService) {
    this.dao = dao;
    this.roles = roles;
    this.userDAO = userDAO;
    this.buildingService = buildingService;
  }
  authorize(user) {
    if (!user || !this.roles.includes(user.role))
      throw new AppError('You do not have access to this page.', 403);
  }
  async create(dto, user) {
    this.authorize(user);
    if (user.role !== 'LANDLORD') throw new AppError('Only landlords can create rooms.', 403);
    const building = dto.building ? await this.buildingService.detail(dto.building, user) : null;
    if (building?.status === 'INACTIVE')
      throw new AppError('Rooms cannot be added to an inactive building.', 409);
    let item;
    try {
      item = await this.dao.create({
        title: dto.title,
        description: dto.description,
        price: dto.price,
        ...(dto.code ? { code: dto.code } : {}),
        ...(dto.area ? { area: dto.area } : {}),
        ...(dto.capacity ? { capacity: dto.capacity } : {}),
        amenities: dto.amenities,
        owner: user.id,
        building: dto.building || null,
        manager: building?.manager || null,
      });
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('This room code already exists in the building.', 409);
      throw error;
    }
    await this.dao.saveRentRate(item._id, item.price, new Date(), user.id);
    return item;
  }
  async createMany(dto, user) {
    this.authorize(user);
    if (user.role !== 'LANDLORD') throw new AppError('Only landlords can create rooms.', 403);
    if (!dto.codes) throw new AppError('Enter a list of room codes.');
    if (!dto.area || !dto.capacity)
      throw new AppError('Area and capacity are required for bulk room creation.');
    const building = dto.building ? await this.buildingService.detail(dto.building, user) : null;
    if (building?.status === 'INACTIVE')
      throw new AppError('Rooms cannot be added to an inactive building.', 409);
    const rooms = dto.codes.map(code => ({
      title: code,
      code,
      description: dto.description,
      price: dto.price,
      area: dto.area,
      capacity: dto.capacity,
      amenities: dto.amenities,
      owner: user.id,
      building: dto.building || null,
      manager: building?.manager || null,
    }));
    let created;
    try {
      created = await this.dao.createMany(rooms);
    } catch (error) {
      if (error?.code === 11000)
        throw new AppError('One or more room codes already exist in this building.', 409);
      throw error;
    }
    await Promise.all(
      created.map(room => this.dao.saveRentRate(room._id, room.price, new Date(), user.id)),
    );
    return created;
  }
  async managers(user) {
    this.authorize(user);
    if (user.role !== 'LANDLORD') return [];
    return this.userDAO.managers();
  }
  async assign(id, managerId, user) {
    this.authorize(user);
    if (user.role !== 'LANDLORD') throw new AppError('Only landlords can assign managers.', 403);
    await this.detail(id, user);
    if (typeof managerId !== 'string' || (managerId !== '' && !/^[a-f\d]{24}$/i.test(managerId)))
      throw new AppError('Please select a valid manager.');
    if (managerId) {
      const manager = await this.userDAO.findById(managerId);
      if (!manager || manager.role !== 'MANAGER')
        throw new AppError('The assigned account must be a property manager.');
    }
    return this.dao.assignManager(id, managerId || null);
  }
  async buildings(user) {
    return user.role === 'LANDLORD' ? this.buildingService.available(user) : [];
  }
  async assignBuilding(id, buildingId, user) {
    this.authorize(user);
    if (user.role !== 'LANDLORD')
      throw new AppError('Only landlords can assign rooms to buildings.', 403);
    await this.detail(id, user);
    if (typeof buildingId !== 'string' || (buildingId && !/^[a-f\d]{24}$/i.test(buildingId)))
      throw new AppError('Please select a valid building.');
    const building = buildingId ? await this.buildingService.detail(buildingId, user) : null;
    if (building?.status === 'INACTIVE')
      throw new AppError('Rooms cannot be assigned to an inactive building.', 409);
    return this.dao.assignBuilding(id, buildingId || null, building?.manager || null);
  }
  async updatePrice(id, rawPrice, effectiveFrom, user) {
    this.authorize(user);
    if (user.role !== 'LANDLORD')
      throw new AppError('Only landlords can configure room prices.', 403);
    await this.detail(id, user);
    const price = Number(rawPrice);
    if (!Number.isSafeInteger(price) || price < 0 || price > 1000000000)
      throw new AppError('Room price must be a whole number between 0 and 1 billion VND.');
    const date = effectiveFrom
      ? /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
        ? new Date(`${effectiveFrom}T00:00:00`)
        : new Date(effectiveFrom)
      : new Date();
    if (Number.isNaN(date.getTime())) throw new AppError('Enter a valid effective date.');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) throw new AppError('Choose today or a future effective date.');
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    if (selectedDay.getTime() === today.getTime()) date.setTime(Date.now());
    if (await this.dao.rentRateExists(id, date))
      throw new AppError('A rent price already exists for this effective date.', 409);
    await this.dao.saveRentRate(id, price, date, user.id);
    if (date <= new Date()) return this.dao.updatePrice(id, price);
    return this.dao.findById(id);
  }
  async rentRates(id, user) {
    await this.detail(id, user);
    return this.dao.rentRates(id);
  }
  async list(user, page) {
    this.authorize(user);
    const filter = user.role === 'LANDLORD' ? { owner: user.id } : { manager: user.id };
    return {
      items: await this.dao.list(filter, (page - 1) * 10, 10),
      total: await this.dao.count(filter),
    };
  }
  async detail(id, user) {
    this.authorize(user);
    if (!/^[a-f\d]{24}$/i.test(id)) throw new AppError('Record not found.', 404);
    const item = await this.dao.findById(id);
    if (
      !item ||
      (user.role === 'LANDLORD' && String(item.owner) !== user.id) ||
      (user.role === 'MANAGER' && String(item.manager) !== user.id)
    )
      throw new AppError('Record not found.', 404);
    return item;
  }
}
