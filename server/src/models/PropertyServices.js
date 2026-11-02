import mongoose from 'mongoose';

const propertyServiceSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    unitType: {
      type: String,
      enum: ['per_month', 'per_unit', 'per_person', 'one_time'],
      default: 'per_month',
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

const PropertyServices = mongoose.model('PropertyService', propertyServiceSchema);

export default PropertyServices;
