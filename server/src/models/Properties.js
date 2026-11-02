import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    utilityRate: {
      electricityPrice: {
        type: Number,
        default: 0,
      },
      waterPrice: {
        type: Number,
        default: 0,
      },
    },
    contractPolicy: {
      paymentDueDay: {
        type: Number,
        default: 5,
      },
      paymentGraceDays: {
        type: Number,
        default: 3,
      },
      depositMonths: {
        type: Number,
        default: 1,
      },
      policyNote: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Properties = mongoose.model('Property', propertySchema);

export default Properties;
