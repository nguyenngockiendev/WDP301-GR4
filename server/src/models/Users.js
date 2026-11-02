import mongoose from 'mongoose';
import { USER_ROLES } from '../shared/constants/roles.js';

const roles = [...USER_ROLES, 'landlord', 'manager', 'tenant'];
const schema = new mongoose.Schema(
  {
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    passwordHash: { type: String, select: false },
    name: { type: String, trim: true, maxlength: 100 },
    fullName: { type: String, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, default: '' },
    role: { type: String, enum: roles, default: 'TENANT' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    active: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date, default: null },
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.username ||= this.email;
  this.name ||= this.fullName;
  this.fullName ||= this.name;
  this.passwordHash ||= this.password;
  this.password ||= this.passwordHash;
  if (this.role) this.role = this.role.toUpperCase();
  if (this.status === 'inactive') this.active = false;
  if (this.active === false) this.status = 'inactive';
  if (!this.passwordHash) this.invalidate('passwordHash', 'Password hash is required.');
  if (!this.name && !this.fullName) this.invalidate('name', 'Full name is required.');
});

export default mongoose.models.User || mongoose.model('User', schema);
