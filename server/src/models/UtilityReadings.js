import mongoose from 'mongoose';

const quantity = { type: Number, min: 0, default: 0 };
const userRef = { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true };
const schema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
    billingMonth: { type: String, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    period: { type: String, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    oldElectricity: quantity,
    newElectricity: quantity,
    electricityReading: quantity,
    electricityPrevious: quantity,
    electricityCurrent: quantity,
    oldWater: quantity,
    newWater: quantity,
    waterReading: quantity,
    waterPrevious: quantity,
    waterCurrent: quantity,
    recordedBy: userRef,
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.period ||= this.billingMonth;
  this.billingMonth ||= this.period;
  this.electricityPrevious ??= this.oldElectricity;
  this.oldElectricity ??= this.electricityPrevious;
  this.electricityCurrent ??= this.newElectricity;
  this.newElectricity ??= this.electricityCurrent;
  this.waterPrevious ??= this.oldWater;
  this.oldWater ??= this.waterPrevious;
  this.waterCurrent ??= this.newWater;
  this.newWater ??= this.waterCurrent;
  this.electricityReading ??= this.electricityCurrent - this.electricityPrevious;
  this.waterReading ??= this.waterCurrent - this.waterPrevious;
  if (this.electricityCurrent < this.electricityPrevious)
    this.invalidate('electricityCurrent', 'Current electricity reading cannot be lower.');
  if (this.waterCurrent < this.waterPrevious)
    this.invalidate('waterCurrent', 'Current water reading cannot be lower.');
});

schema.index({ room: 1, period: 1 }, { unique: true });

export default mongoose.models.UtilityReading || mongoose.model('UtilityReading', schema);
