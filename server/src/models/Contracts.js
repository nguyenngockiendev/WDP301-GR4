import mongoose from 'mongoose';

const contractMemberSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isRepresentative: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

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
    members: [contractMemberSchema],
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
  },
);

const Contracts = mongoose.model('Contract', contractSchema);

export default Contracts;
