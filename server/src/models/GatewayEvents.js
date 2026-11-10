import mongoose from 'mongoose';

const gatewayEventSchema = new mongoose.Schema({
  provider: { type: String, default: 'vnpay' },
  source: { type: String, enum: ['IPN', 'RETURN'], required: true },
  txnRef: { type: String, maxlength: 100, index: true },
  gatewayTransactionNo: { type: String, maxlength: 100 },
  amount: { type: Number, default: null },
  responseCode: String,
  transactionStatus: String,
  signatureValid: { type: Boolean, default: null },
  processResult: {
    type: String,
    enum: [
      'RECEIVED',
      'PROCESSING',
      'APPLIED',
      'DUPLICATE',
      'ORDER_NOT_FOUND',
      'AMOUNT_MISMATCH',
      'INVALID_SIGNATURE',
      'INVALID_PAYLOAD',
      'ERROR',
    ],
    default: 'RECEIVED',
  },
  raw: { type: mongoose.Schema.Types.Mixed, default: {} },
  rawTruncated: { type: Boolean, default: false },
  resultCode: String,
  receivedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
});
gatewayEventSchema.index({ txnRef: 1, receivedAt: -1 });
export default mongoose.model('GatewayEvent', gatewayEventSchema);
