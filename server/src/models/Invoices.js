import mongoose from 'mongoose';

const reference = (model, required = false) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: model,
  required,
});
const lineSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['rent', 'electricity', 'water', 'service', 'other'] },
    kind: { type: String, enum: ['RENT', 'ELECTRICITY', 'WATER', 'SERVICE', 'OTHER'] },
    description: { type: String, trim: true, maxlength: 100 },
    quantity: { type: Number, min: 0 },
    unitPrice: { type: Number, min: 0, validate: Number.isSafeInteger },
    amount: { type: Number, required: true, min: 0, validate: Number.isSafeInteger },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    code: { type: String, trim: true, maxlength: 100 },
    contract: reference('Contract', true),
    room: reference('Room'),
    building: reference('Building'),
    tenant: reference('User'),
    utilityReading: reference('UtilityReading'),
    reading: reference('UtilityReading'),
    billingMonth: { type: String, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    period: { type: String, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    items: { type: [lineSchema], default: undefined },
    lines: { type: [lineSchema], default: undefined },
    adjustments: [
      {
        amount: { type: Number, required: true, validate: Number.isSafeInteger },
        reason: { type: String, required: true, trim: true, maxlength: 500 },
        adjustedBy: reference('User'),
        adjustedAt: { type: Date, default: Date.now },
      },
    ],
    totalAmount: { type: Number, min: 0, validate: Number.isSafeInteger },
    total: { type: Number, min: 0, validate: Number.isSafeInteger },
    paidAmount: { type: Number, min: 0, validate: Number.isSafeInteger, default: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'VOID', 'unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'DRAFT',
    },
    issuedAt: Date,
    adjustedBy: reference('User'),
    createdBy: reference('User', true),
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.period ||= this.billingMonth;
  this.billingMonth ||= this.period;
  this.reading ||= this.utilityReading;
  this.utilityReading ||= this.reading;
  this.total ??= this.totalAmount;
  this.totalAmount ??= this.total;

  if (!this.lines?.length && this.items?.length) {
    this.lines = this.items.map(item => ({
      ...item.toObject(),
      kind: item.type?.toUpperCase(),
      quantity: item.quantity ?? 1,
      unitPrice: item.unitPrice ?? item.amount,
    }));
  }
  if (!this.items?.length && this.lines?.length) {
    this.items = this.lines.map(line => ({
      ...line.toObject(),
      type: line.kind?.toLowerCase(),
    }));
  }

  const sum = (this.lines || []).reduce((amount, line) => amount + line.amount, 0);
  const adjustments = this.adjustments.reduce((amount, item) => amount + item.amount, 0);
  if (this.total !== undefined && sum + adjustments !== this.total)
    this.invalidate('total', 'Invoice total does not match its line items.');
  if (this.paidAmount > (this.total || 0))
    this.invalidate('paidAmount', 'Paid amount cannot exceed invoice total.');
  for (const line of this.lines || []) {
    if (
      line.quantity !== undefined &&
      line.unitPrice !== undefined &&
      line.amount !== Math.round(line.quantity * line.unitPrice)
    ) {
      this.invalidate('lines', 'Line amount must equal quantity times unit price.');
    }
  }
});

schema.index({ code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
schema.index({ contract: 1, period: 1 }, { unique: true });
schema.index({ tenant: 1, status: 1, dueDate: 1 });
schema.index({ building: 1, period: 1 });

export default mongoose.models.Invoice || mongoose.model('Invoice', schema);
