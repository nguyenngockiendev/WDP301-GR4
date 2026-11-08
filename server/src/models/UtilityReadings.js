import mongoose from 'mongoose';

const utilityReadingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    billingMonth: {
      type: String,
      required: true,
    },
    oldElectricity: {
      type: Number,
      required: true,
      default: 0,
    },
    newElectricity: {
      type: Number,
      required: true,
      default: 0,
    },
    electricityReading: {
      type: Number,
      required: true,
      default: 0,
    },
    oldWater: {
      type: Number,
      required: true,
      default: 0,
    },
    newWater: {
      type: Number,
      required: true,
      default: 0,
    },
    waterReading: {
      type: Number,
      required: true,
      default: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

utilityReadingSchema.index({ room: 1, billingMonth: 1 }, { unique: true });

const UtilityReadings = mongoose.model('UtilityReading', utilityReadingSchema);

export default UtilityReadings;
