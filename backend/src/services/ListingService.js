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
    if (user.role !== 'ADMIN') throw new AppError('Only landlords can create rooms.', 403);
    if (dto.building) await this.buildingService.detail(dto.building, user);
    return this.dao.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      owner: user.id,
      building: dto.building || null,
    });
  }
  async managers(user) {
    this.authorize(user);
    if (user.role !== 'ADMIN') return [];
    return this.userDAO.managers();
  }
  async assign(id, managerId, user) {
    this.authorize(user);
    if (user.role !== 'ADMIN') throw new AppError('Only landlords can assign managers.', 403);
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
    return user.role === 'ADMIN' ? this.buildingService.available(user) : [];
  }
  async assignBuilding(id, buildingId, user) {
    this.authorize(user);
    if (user.role !== 'ADMIN')
      throw new AppError('Only landlords can assign rooms to buildings.', 403);
    await this.detail(id, user);
    if (typeof buildingId !== 'string' || (buildingId && !/^[a-f\d]{24}$/i.test(buildingId)))
      throw new AppError('Please select a valid building.');
    if (buildingId) await this.buildingService.detail(buildingId, user);
    return this.dao.assignBuilding(id, buildingId || null);
  }
  async list(user, page) {
    this.authorize(user);
    const filter = user.role === 'ADMIN' ? {} : { manager: user.id };
    return {
      items: await this.dao.list(filter, (page - 1) * 10, 10),
      total: await this.dao.count(filter),
    };
  }
  async detail(id, user) {
    this.authorize(user);
    if (!/^[a-f\d]{24}$/i.test(id)) throw new AppError('Record not found.', 404);
    const item = await this.dao.findById(id);
    if (!item || (user.role !== 'ADMIN' && String(item.manager) !== user.id))
      throw new AppError('Record not found.', 404);
    return item;
  }
}
