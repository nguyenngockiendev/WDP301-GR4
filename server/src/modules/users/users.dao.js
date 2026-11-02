import User from '../../models/Users.js';
export class UserDAO {
  managers() {
    return User.find({
      role: { $in: ['MANAGER', 'manager'] },
      $or: [{ active: true }, { active: { $exists: false }, status: 'active' }],
    }).sort({ name: 1 });
  }
  findByEmail(email) {
    return User.findOne({ email }).select('+passwordHash +password');
  }
  findById(id) {
    return User.findById(id);
  }
  findByIdWithPassword(id) {
    return User.findById(id).select('+password +passwordHash');
  }
  create(data) {
    return User.create(data);
  }
  list(skip, limit) {
    return User.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit);
  }
  count() {
    return User.countDocuments();
  }
  updateProfile(id, data) {
    return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  }
  updatePassword(id, passwordHash) {
    return User.findByIdAndUpdate(
      id,
      { $set: { passwordHash, password: passwordHash, passwordChangedAt: new Date() } },
      { new: true, runValidators: true },
    );
  }
  setActive(id, active) {
    return User.findOneAndUpdate(
      { _id: id, role: { $in: ['MANAGER', 'manager'] } },
      { $set: { active, status: active ? 'active' : 'inactive' } },
      { new: true, runValidators: true },
    );
  }
  deleteById(id) {
    return User.findByIdAndDelete(id);
  }
  markEmailVerified(id) {
    return User.findByIdAndUpdate(
      id,
      { $set: { emailVerifiedAt: new Date(), verificationRequired: false } },
      { new: true },
    );
  }
}
