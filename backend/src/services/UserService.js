import bcrypt from 'bcryptjs';
import { UserDTO } from '../dto/UserDTO.js';
import { AppError } from '../utils/errors.js';
import { USER_ROLES } from '../config/roles.js';
export class UserService {
  constructor(dao) {
    this.dao = dao;
  }
  async create(dto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      return new UserDTO(
        await this.dao.create({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
          passwordHash,
        }),
      );
    } catch (error) {
      if (error.code === 11000) throw new AppError('This email is already registered.', 409);
      throw error;
    }
  }
  async login(dto) {
    const user = await this.dao.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new AppError('Incorrect email or password.', 401);
    if (!USER_ROLES.includes(user.role))
      throw new AppError('Your account role is no longer supported. Contact your landlord.', 403);
    return new UserDTO(user);
  }
  async detail(id) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new AppError('User not found.', 404);
    const user = await this.dao.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    return new UserDTO(user);
  }
  async list(page) {
    return {
      items: (await this.dao.list((page - 1) * 10, 10)).map(u => new UserDTO(u)),
      total: await this.dao.count(),
    };
  }
  async profile(id, dto) {
    return new UserDTO(await this.dao.updateProfile(id, { name: dto.name, phone: dto.phone }));
  }
}
