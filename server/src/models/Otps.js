import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    otpCode: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['register', 'forgot_password', 'verification', 'other'],
      default: 'verification',
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Otps = mongoose.model('Otp', otpSchema);

export default Otps;
