import mongoose from 'mongoose';
import { USER_ROLES } from '../shared/constants/roles.js';
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    fullName: { type: String, trim: true, maxlength: 100 },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerifiedAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    passwordChangedAt: Date,
    phone: { type: String, default: '' },
    role: { type: String, enum: USER_ROLES, default: 'TENANT' },
  },
  { timestamps: true },
);
schema.pre('validate', function () {
  this.name ||= this.fullName;
  this.fullName ||= this.name;
  this.username ||= this.email;
  if (this.status === 'inactive') this.active = false;
});
schema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'LANDLORD' } });
export default mongoose.model('User', schema);
