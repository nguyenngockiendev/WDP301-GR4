import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    brand: { type: String, trim: true, maxlength: 80, default: '' },
    model: { type: String, trim: true, maxlength: 80, default: '' },
    assetCode: { type: String, trim: true, maxlength: 60, default: '' },
    purchaseDate: { type: Date, default: null },
    warrantyExpiryDate: { type: Date, default: null },
    purchasePrice: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['in_stock', 'in_use', 'maintenance', 'retired'],
      default: 'in_stock',
    },
    note: { type: String, trim: true, maxlength: 1000, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

assetSchema.index(
  { property: 1, assetCode: 1 },
  { unique: true, partialFilterExpression: { assetCode: { $type: 'string', $gt: '' } } }
);

export default mongoose.model('Asset', assetSchema);
