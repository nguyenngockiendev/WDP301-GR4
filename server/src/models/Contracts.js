import mongoose from 'mongoose';

const reference = (model, required = false) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: model,
  required,
});
const money = { type: Number, min: 0, validate: Number.isSafeInteger };
const shortText = { type: String, trim: true, maxlength: 100 };
const schema = new mongoose.Schema(
  {
    code: shortText,
    room: reference('Room', true),
    building: reference('Building'),
    property: reference('Property'),
    rentalRequest: reference('RentalRequest'),
    template: reference('ContractTemplate'),
    tenant: reference('User'),
    representative: reference('User'),
    occupants: [reference('User')],
    otherMembers: [reference('User')],
    occupantCount: { type: Number, min: 1, default: 1, validate: Number.isInteger },
    previousContract: reference('Contract'),
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rent: money,
    monthlyRent: money,
    deposit: money,
    depositAmount: money,
    policySnapshot: {
      minMonths: Number,
      version: Number,
      terms: String,
      noticeDays: Number,
      paymentDueDay: Number,
      paymentGraceDays: Number,
    },
    feesSnapshot: [
      {
        code: shortText,
        name: shortText,
        unit: { type: String, enum: ['MONTH', 'PERSON', 'USAGE', 'month', 'person', 'usage'] },
        usageUnit: String,
        price: money,
      },
    ],
    status: {
      type: String,
      enum: [
        'DRAFT', 'PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'ENDED', 'CANCELLED',
        'active', 'expired', 'terminated', 'draft',
      ],
      default: 'DRAFT',
    },
    occupiesRoom: { type: Boolean, default: false },
    createdBy: reference('User', true),
    approvedBy: reference('User'),
    approvedAt: Date,
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.tenant ||= this.representative;
  this.representative ||= this.tenant;
  if (!this.occupants.length) this.occupants = this.otherMembers;
  if (!this.otherMembers.length) this.otherMembers = this.occupants;
  this.rent ??= this.monthlyRent;
  this.monthlyRent ??= this.rent;
  this.deposit ??= this.depositAmount ?? 0;
  this.depositAmount ??= this.deposit;
  if (this.endDate <= this.startDate)
    this.invalidate('endDate', 'End date must be after start date.');
  this.occupiesRoom = ['APPROVED', 'ACTIVE', 'active'].includes(this.status);
});

schema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
schema.index({ room: 1 }, { unique: true, partialFilterExpression: { occupiesRoom: true } });
schema.index({ tenant: 1, status: 1 });
schema.index({ building: 1, status: 1 });

export default mongoose.models.Contract || mongoose.model('Contract', schema);
