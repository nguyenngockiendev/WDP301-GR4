import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
  image: String,
  signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  signedAt: Date,
}, { _id: false });

const signingSchema = new mongoose.Schema({
  revision: mongoose.Schema.Types.ObjectId,
  status: { type: String, enum: ['awaiting_tenant', 'awaiting_manager', 'signed', 'rejected', 'withdrawn'] },
  title: String,
  document: { type: String, select: false },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  depositInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  tenantSignature: { type: signatureSchema, select: false },
  managerSignature: { type: signatureSchema, select: false },
  rejectionReason: String,
}, { _id: false });

const contractSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    rentalRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalRequest',
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContractTemplate',
    },
    // Bản lưu tên + nội dung mẫu lúc lập hợp đồng (sửa mẫu sau không ảnh hưởng hợp đồng cũ)
    utilityRateSnapshot: {
      electricityPrice: Number,
      waterPrice: Number,
    },
    templateTitle: {
      type: String,
      trim: true,
    },
    templateContent: {
      type: String,
    },
    signing: signingSchema,
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestSnapshot: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true },
      phone: { type: String, trim: true },
    },
    otherMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    checkoutInspection: {
      checkedAt: { type: Date, default: null },
      checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      note: { type: String, trim: true, maxlength: 1000, default: '' },
      assets: [
        {
          asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
          assetCode: { type: String, trim: true, default: '' },
          name: { type: String, trim: true, required: true },
          damaged: { type: Boolean, default: false },
          compensationAmount: { type: Number, min: 0, default: 0 },
          note: { type: String, trim: true, maxlength: 500, default: '' },
        },
      ],
    },
    paymentDueDay: {
      type: Number,
      min: 1,
      max: 28,
      default: 5,
    },
    paymentGraceDays: {
      type: Number,
      min: 0,
      max: 60,
      default: 3,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'terminated', 'draft'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Contracts = mongoose.model('Contract', contractSchema);

export default Contracts;
