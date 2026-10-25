import mongoose from 'mongoose';

const terminationRequestSchema = new mongoose.Schema(
  {
    contract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract',
      required: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    depositDeduction: {
      type: Number,
      default: 0,
    },
    depositRefund: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const TerminationRequests = mongoose.model('TerminationRequest', terminationRequestSchema);

export default TerminationRequests;
