import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    role: {
      type: String,
      enum: ['landlord', 'manager', 'tenant'],
      default: 'tenant',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// The application supports one primary landlord account per database.
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: 'landlord' },
    name: 'one_primary_landlord',
  },
);

const Users = mongoose.model('User', userSchema);

export default Users;
