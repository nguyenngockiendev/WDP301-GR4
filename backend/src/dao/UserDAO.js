import User from '../entities/User.js';
export class UserDAO {
  managers() { return User.find({ role: 'MANAGER' }).sort({ name: 1 }); }
  findByEmail(email) { return User.findOne({ email }).select('+passwordHash'); }
  findById(id) { return User.findById(id); }
  create(data) { return User.create(data); }
  list(skip, limit) { return User.find().sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit); }
  count() { return User.countDocuments(); }
  updateProfile(id, data) { return User.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }); }
}
