import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import Users from '../../models/Users.js';
import Otps from '../../models/Otps.js';
import { sendOtpEmail } from './email.service.js';

const publicUser = user => ({
  userId: user._id,
  username: user.username,
  email: user.email,
  fullName: user.fullName,
  phone: user.phone || '',
  role: user.role,
});
const otpSecret = () => process.env.OTP_SECRET || process.env.SESSION_SECRET || 'development-otp-secret';
const hashOtp = (userId, code) =>
  crypto.createHmac('sha256', otpSecret()).update(`${userId}:${code}`).digest('hex');

export async function issueOtp(user, purpose = 'register') {
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  await Otps.deleteMany({ user: user._id, purpose, isUsed: false });
  await Otps.create({
    user: user._id,
    contact: user.email,
    otpHash: hashOtp(user._id, code),
    purpose,
    createdAt: now,
    expiresAt,
  });
  try {
    await sendOtpEmail({ to: user.email, code, purpose });
  } catch (error) {
    await Otps.deleteMany({ user: user._id, purpose, isUsed: false });
    throw error;
  }
}

export async function registerUser(data) {
  const username = String(data.username || '').trim();
  const email = String(data.email || '').trim().toLowerCase();
  const fullName = String(data.fullName || '').trim();
  if (!username || !email || !fullName || !data.password) {
    throw { status: 400, message: 'Vui lòng điền đầy đủ thông tin.' };
  }
  if (String(data.password).length < 8) {
    throw { status: 400, message: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }
  if (await Users.exists({ $or: [{ email }, { username }] })) {
    throw { status: 409, message: 'Email hoặc username đã được sử dụng.' };
  }
  // The first public account becomes the single landlord; later accounts are tenants.
  const role = (await Users.exists({ role: 'landlord' })) ? 'tenant' : 'landlord';
  let user;
  try {
    user = await Users.create({
      username,
      email,
      fullName,
      phone: String(data.phone || '').trim(),
      password: await bcrypt.hash(data.password, 12),
      role,
      status: 'active',
      isVerified: false,
    });
  } catch (error) {
    // A concurrent first registration can lose the unique-landlord race; retry it as tenant.
    if (role !== 'landlord' || error?.code !== 11000 || error?.keyPattern?.role !== 1) throw error;
    user = await Users.create({
      username,
      email,
      fullName,
      phone: String(data.phone || '').trim(),
      password: await bcrypt.hash(data.password, 12),
      role: 'tenant',
      status: 'active',
      isVerified: false,
    });
  }
  try {
    await issueOtp(user, 'register');
    return { user: publicUser(user), verificationRequired: true, emailSent: true };
  } catch (error) {
    return { user: publicUser(user), verificationRequired: true, emailSent: false, emailError: error.message };
  }
}

export async function verifyRegistrationOtp({ email, otp }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await Users.findOne({ email: normalizedEmail });
  if (!user) throw { status: 404, message: 'Không tìm thấy tài khoản.' };
  if (user.isVerified) return publicUser(user);
  const challenge = await Otps.findOne({ user: user._id, purpose: 'register', isUsed: false })
    .sort({ createdAt: -1 });
  if (!challenge || challenge.expiresAt <= new Date()) {
    throw { status: 400, message: 'Mã đã hết hạn. Hãy yêu cầu gửi mã mới.' };
  }
  if (challenge.attemptCount >= 5) {
    throw { status: 429, message: 'Bạn đã nhập sai quá số lần cho phép. Hãy yêu cầu mã mới.' };
  }
  const expected = Buffer.from(challenge.otpHash);
  const received = Buffer.from(hashOtp(user._id, String(otp || '').trim()));
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    challenge.attemptCount += 1;
    await challenge.save();
    throw { status: 400, message: 'Mã OTP không chính xác.' };
  }
  challenge.isUsed = true;
  user.isVerified = true;
  await Promise.all([challenge.save(), user.save()]);
  return publicUser(user);
}

export async function resendRegistrationOtp(email) {
  const user = await Users.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user) throw { status: 404, message: 'Không tìm thấy tài khoản.' };
  if (user.isVerified) throw { status: 409, message: 'Tài khoản đã được xác thực.' };
  await issueOtp(user, 'register');
}

export async function loginUser({ identifier, email, password }) {
  const loginId = String(identifier || email || '').trim().toLowerCase();
  if (!loginId || !password) throw { status: 400, message: 'Vui lòng nhập tài khoản và mật khẩu.' };
  const user = await Users.findOne({ $or: [{ email: loginId }, { username: loginId }] });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw { status: 401, message: 'Tài khoản hoặc mật khẩu không chính xác.' };
  }
  if (user.status !== 'active') throw { status: 403, message: 'Tài khoản đã bị vô hiệu hóa.' };
  if (!user.isVerified) throw { status: 403, message: 'Hãy xác thực email trước khi đăng nhập.' };
  return publicUser(user);
}

export async function updateProfile(userId, data) {
  const fullName = String(data.fullName || '').trim();
  const phone = String(data.phone || '').trim();
  if (fullName.length < 2 || fullName.length > 120) {
    throw { status: 400, message: 'Họ tên phải từ 2 đến 120 ký tự.' };
  }
  if (phone.length > 30) throw { status: 400, message: 'Số điện thoại quá dài.' };
  const user = await Users.findByIdAndUpdate(
    userId,
    { $set: { fullName, phone } },
    { new: true, runValidators: true },
  );
  if (!user) throw { status: 404, message: 'Không tìm thấy tài khoản.' };
  return publicUser(user);
}

export async function changePassword(userId, { currentPassword, newPassword, confirmPassword }) {
  if (!currentPassword || !newPassword) throw { status: 400, message: 'Hãy nhập mật khẩu hiện tại và mật khẩu mới.' };
  if (String(newPassword).length < 8) throw { status: 400, message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' };
  if (newPassword !== confirmPassword) throw { status: 400, message: 'Mật khẩu xác nhận không khớp.' };
  const user = await Users.findById(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    throw { status: 400, message: 'Mật khẩu hiện tại không chính xác.' };
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
}

export { publicUser };
