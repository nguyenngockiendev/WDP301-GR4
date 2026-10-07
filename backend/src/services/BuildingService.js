import { AppError } from '../utils/errors.js';

const validId = id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);

export class BuildingService {
  constructor(dao, userDAO) {
    this.dao = dao;
    this.userDAO = userDAO;
  }
  authorize(user) {
    if (user?.role !== 'LANDLORD') throw new AppError('Only landlords can manage buildings.', 403);
  }
  async detail(id, user) {
    this.authorize(user);
    if (!validId(id)) throw new AppError('Building not found.', 404);
    const item = await this.dao.findById(id);
    if (!item || String(item.owner) !== user.id) throw new AppError('Building not found.', 404);
    return item;
  }
  async list(user, page) {
    this.authorize(user);
    return {
      items: await this.dao.list(user.id, (page - 1) * 10, 10),
      total: await this.dao.count(user.id),
    };
  }
  async create(dto, user) {
    this.authorize(user);
    try {
      return await this.dao.create({ ...dto, owner: user.id });
    } catch (error) {
      if (error?.code === 11000) throw new AppError('A building with this name already exists.');
      throw error;
    }
  }
  async update(id, dto, user) {
    await this.detail(id, user);
    try {
      return await this.dao.update(id, dto);
    } catch (error) {
      if (error?.code === 11000) throw new AppError('A building with this name already exists.');
      throw error;
    }
  }
  async remove(id, user) {
    await this.detail(id, user);
    if (await this.dao.roomCount(id))
      throw new AppError('Move or remove all rooms from this building before deleting it.', 409);
    return this.dao.delete(id);
  }
  async available(user) {
    this.authorize(user);
    return this.dao.available(user.id);
  }
  async managers(user) {
    this.authorize(user);
    return this.userDAO.managers();
  }
  async assignManager(id, managerId, user) {
    await this.detail(id, user);
    if (typeof managerId !== 'string' || (managerId && !validId(managerId)))
      throw new AppError('Please select a valid manager.');
    if (managerId) {
      const manager = await this.userDAO.findById(managerId);
      if (!manager || manager.role !== 'MANAGER')
        throw new AppError('The assigned account must be a property manager.');
    }
    return this.dao.assignManager(id, managerId || null);
  }
  async setStatus(id, status, user) {
    await this.detail(id, user);
    if (!['ACTIVE', 'INACTIVE'].includes(status))
      throw new AppError('Please select a valid building status.');
    return this.dao.updateStatus(id, status);
  }
}
