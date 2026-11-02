import bcrypt from 'bcryptjs';
import { UserDTO } from './users.dto.js';
import { AppError } from '../../shared/utils/errors.js';
import { USER_ROLES } from '../../shared/constants/roles.js';
import { randomInt } from 'node:crypto';
import OtpChallenge from '../../models/OtpChallenge.js';
import { sendOtpEmail } from '../auth/email.service.js';

const cleanEmail = value => String(value || '').trim().toLowerCase();
const otpError = () => new AppError('Mã xác nhận không hợp lệ hoặc đã hết hạn.', 400);

export class UserService {
  constructor(dao) {
    this.dao = dao;
  }
  async create(dto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    try {
      const user = await this.dao.create({
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
          passwordHash,
          verificationRequired: true,
        });
      await this.issueOtp(user.email, user._id, 'VERIFY_ACCOUNT');
      return { email: user.email, verificationRequired: true };
    } catch (error) {
      if (error.status === 503) {
        const pending = await this.dao.findByEmail(dto.email);
        if (pending?.verificationRequired) await this.dao.deleteById(pending._id);
      }
      if (error.code === 11000 && error.keyPattern?.role)
        throw new AppError('A Landlord account already exists.', 409);
      if (error.code === 11000) throw new AppError('This email is already registered.', 409);
      throw error;
    }
  }
  async login(dto) {
    const user = await this.dao.findByEmail(dto.email);
    const passwordHash = user?.passwordHash || user?.password;
    if (!user || !passwordHash || !(await bcrypt.compare(dto.password, passwordHash)))
      throw new AppError('Incorrect email or password.', 401);
    if (user.active === false || user.status === 'inactive')
      throw new AppError('Your account is inactive. Contact your landlord.', 403);
    if (user.verificationRequired && !user.emailVerifiedAt)
      throw new AppError('Verify your email address before signing in.', 403);
    if (!USER_ROLES.includes(user.role?.toUpperCase()))
      throw new AppError('Your account role is no longer supported. Contact your landlord.', 403);
    return new UserDTO({ ...user.toObject(), role: user.role.toUpperCase() });
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
  async changePassword(id, currentPassword, newPassword) {
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string')
      throw new AppError('Enter your current and new password.');
    if (newPassword.length < 8 || Buffer.byteLength(newPassword) > 72)
      throw new AppError('New password must be at least 8 characters and no more than 72 bytes.');
    const user = await this.dao.findByIdWithPassword(id);
    const passwordHash = user?.passwordHash || user?.password;
    if (!user || !passwordHash || !(await bcrypt.compare(currentPassword, passwordHash)))
      throw new AppError('Current password is incorrect.', 401);
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.dao.updatePassword(id, hashed);
    return { ok: true };
  }
  async setManagerStatus(id, active) {
    if (typeof active !== 'boolean') throw new AppError('Choose an account status.');
    const user = await this.dao.setActive(id, active);
    if (!user) throw new AppError('Manager account not found.', 404);
    return new UserDTO(user);
  }

  async issueOtp(email, userId, purpose) {
    const normalized = cleanEmail(email);
    const recent = await OtpChallenge.findOne({
      email: normalized,
      purpose,
      createdAt: { $gt: new Date(Date.now() - 60_000) },
    }).lean();
    if (recent) throw new AppError('Wait one minute before requesting another code.', 429);

    await OtpChallenge.updateMany(
      { email: normalized, purpose, consumedAt: null },
      { $set: { consumedAt: new Date() } },
    );
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const challenge = await OtpChallenge.create({
      user: userId,
      email: normalized,
      purpose,
      tokenHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    try {
      await sendOtpEmail({ to: normalized, code, purpose });
    } catch (error) {
      await OtpChallenge.deleteOne({ _id: challenge._id });
      throw error;
    }
  }

  async consumeOtp(email, code, purpose) {
    const challenge = await OtpChallenge.findOne({
      email: cleanEmail(email),
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 5 },
    }).sort({ createdAt: -1 }).select('+tokenHash');
    if (!challenge) throw otpError();
    if (!/^\d{6}$/.test(String(code || '')) || !(await bcrypt.compare(String(code), challenge.tokenHash))) {
      await OtpChallenge.updateOne(
        { _id: challenge._id, attempts: { $lt: 5 }, consumedAt: null },
        { $inc: { attempts: 1 } },
      );
      throw otpError();
    }
    const consumed = await OtpChallenge.findOneAndUpdate(
      {
        _id: challenge._id,
        consumedAt: null,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 5 },
      },
      { $set: { consumedAt: new Date() } },
      { new: true },
    );
    if (!consumed) throw otpError();
    return consumed;
  }

  async verifyEmail(email, code) {
    const normalized = cleanEmail(email);
    const user = await this.dao.findByEmail(normalized);
    if (!user || !user.verificationRequired || user.emailVerifiedAt)
      throw new AppError('No email verification is pending for this account.', 404);
    await this.consumeOtp(normalized, code, 'VERIFY_ACCOUNT');
    await this.dao.markEmailVerified(user._id);
    return { ok: true };
  }

  async resendVerification(email) {
    const normalized = cleanEmail(email);
    const user = await this.dao.findByEmail(normalized);
    if (!user || !user.verificationRequired || user.emailVerifiedAt)
      throw new AppError('No email verification is pending for this account.', 404);
    await this.issueOtp(normalized, user._id, 'VERIFY_ACCOUNT');
    return { ok: true };
  }

  async requestPasswordReset(email) {
    const normalized = cleanEmail(email);
    const user = await this.dao.findByEmail(normalized);
    if (user) await this.issueOtp(normalized, user._id, 'RESET_PASSWORD');
    return { ok: true };
  }

  async resetPassword(email, code, newPassword) {
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword) > 72)
      throw new AppError('New password must be at least 8 characters and no more than 72 bytes.');
    const challenge = await this.consumeOtp(email, code, 'RESET_PASSWORD');
    const user = await this.dao.findByEmail(cleanEmail(email));
    if (!user || String(user._id) !== String(challenge.user)) throw otpError();
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.dao.updatePassword(user._id, passwordHash);
    return { ok: true };
  }
}
