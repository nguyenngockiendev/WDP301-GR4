import mongoose from 'mongoose';

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
    templateTitle: {
      type: String,
      trim: true,
    },
    templateContent: {
      type: String,
    },
    representative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
