import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['rent', 'electricity', 'water', 'service', 'other'],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: Number,
    unitPrice: Number,
    amount: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    billedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    utilityReading: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UtilityReading',
    },
    billingMonth: {
      type: String,
      required: true,
    },
    items: [invoiceItemSchema],
    images: {
      type: [String],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'],
      default: 'unpaid',
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ contract: 1, billingMonth: 1 }, { unique: true });

const Invoices = mongoose.model('Invoice', invoiceSchema);

export default Invoices;
