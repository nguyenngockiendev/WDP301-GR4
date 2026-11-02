import mongoose from 'mongoose';

const reference = (model, required = false) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: model,
  required,
});
const schema = new mongoose.Schema(
  {
    invoice: reference('Invoice', true),
    payer: reference('User'),
    tenant: reference('User'),
    method: {
      type: String,
      enum: ['CASH', 'BANK', 'GATEWAY', 'cash', 'transfer', 'gateway'],
      default: 'CASH',
    },
    amount: { type: Number, required: true, min: 1, validate: Number.isSafeInteger },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'pending', 'success', 'failed', 'cancelled'],
      default: 'PENDING',
    },
    gatewayTransactionId: { type: String, trim: true, default: null },
    provider: { type: String, trim: true },
    providerTransactionId: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true, maxlength: 100 },
    recordedBy: reference('User'),
    paidAt: { type: Date, default: Date.now },
    note: String,
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.tenant ||= this.payer;
  this.payer ||= this.tenant;
  this.gatewayTransactionId ||= this.providerTransactionId;
  this.providerTransactionId ||= this.gatewayTransactionId;
});

schema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
schema.index(
  { provider: 1, providerTransactionId: 1 },
  {
    unique: true,
    partialFilterExpression: { providerTransactionId: { $type: 'string' } },
  },
);
schema.index({ invoice: 1, status: 1 });
schema.index({ status: 1, paidAt: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', schema);
