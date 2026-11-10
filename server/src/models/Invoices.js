
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

    // Liên kết với tài sản được kiểm tra
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      default: null,
    },

    // Tình trạng tài sản sau khi kiểm tra
    assetStatus: {
      type: String,
      enum: ['in_use', 'maintenance', 'retired'],
      default: null,
    },

    // Ảnh hóa đơn bảo trì (Base64)
    images: {
      type: [String],
      default: [],
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

    // Phân biệt hóa đơn tháng và hóa đơn checkout tài sản
    invoiceType: {
      type: String,
      enum: ['monthly', 'checkout_asset', 'deposit'],
      default: 'monthly',
      index: true,
    },

    // Liên kết hóa đơn với yêu cầu trả phòng
    terminationRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TerminationRequest',
      default: null,
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
      enum: [
        'draft',
        'unpaid',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled',
      ],
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

// Giữ nguyên unique index hóa đơn theo hợp đồng và kỳ thanh toán
invoiceSchema.index(
  { contract: 1, billingMonth: 1 },
  { unique: true },
);

// Mỗi checkout request chỉ có một hóa đơn checkout tài sản
invoiceSchema.index(
  { terminationRequest: 1, invoiceType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      invoiceType: 'checkout_asset',
    },
  },
);

const Invoices = mongoose.model('Invoice', invoiceSchema);

export default Invoices;
