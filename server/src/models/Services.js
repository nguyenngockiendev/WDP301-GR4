import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    unitType: {
      type: String,
      enum: ['fixed', 'per_room', 'per_person'],
      default: 'fixed',
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
);

const Services = mongoose.model('Service', serviceSchema);

export default Services;
