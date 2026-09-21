import { AppError } from '../utils/errors.js';
import { USER_ROLES, ROLE_LABELS } from '../config/roles.js';
export function text(value, label, min = 1, max = 100) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) throw new AppError(`${label}: must contain ${min} to ${max} characters.`);
  return value.trim();
}
export class ProfileDTO {
  constructor(body) {
    this.name = text(body.name, 'Full name', 2);
    this.phone = text(body.phone ?? '', 'Phone number', 0, 20);
    if (this.phone && !/^[+\d\s()-]{7,20}$/.test(this.phone)) throw new AppError('Please enter a valid phone number.');
  }
}
export class LoginDTO {
  constructor(body) {
    this.email = text(body.email, 'Email', 3, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) throw new AppError('Please enter a valid email address.');
    if (typeof body.password !== 'string' || body.password.length < 8 || Buffer.byteLength(body.password) > 72) throw new AppError('Password must have at least 8 characters and at most 72 bytes.');
    this.password = body.password;
  }
}
export class CreateUserDTO extends LoginDTO {
  constructor(body, admin = false) {
    super(body);
    Object.assign(this, new ProfileDTO(body));
    this.role = admin ? body.role : 'TENANT';
    if (!USER_ROLES.includes(this.role)) throw new AppError('Invalid role.');
  }
}
export class UserDTO {
  constructor(user) {
    this.id = String(user._id); this.name = user.name; this.email = user.email;
    this.phone = user.phone; this.role = user.role; this.createdAt = user.createdAt;
    this.roleLabel = ROLE_LABELS[user.role] ?? 'Unsupported legacy role';
  }
}
