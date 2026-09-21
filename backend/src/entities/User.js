import mongoose from 'mongoose';
import { USER_ROLES } from '../config/roles.js';
const schema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  emailVerifiedAt: { type: Date, default: null },
  active: { type: Boolean, default: true },
  passwordChangedAt: Date,
  phone: { type: String, default: '' },
  role: { type: String, enum: USER_ROLES, default: 'TENANT' }
}, { timestamps: true });
export default mongoose.model('User', schema);
