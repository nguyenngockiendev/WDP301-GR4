import mongoose from 'mongoose';

const userRef = { type: mongoose.Schema.Types.ObjectId, ref: 'User' };
const schema = new mongoose.Schema(
  {
    tenant: { ...userRef, required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    expectedDate: Date,
    message: { type: String, trim: true, maxlength: 2000 },
    note: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'PENDING',
    },
    processedBy: { ...userRef, default: null },
    handledBy: { ...userRef, default: null },
    handledAt: Date,
    rejectReason: { type: String, trim: true, maxlength: 2000, default: null },
    rejectionReason: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.message ||= this.note;
  this.note ||= this.message;
  this.processedBy ||= this.handledBy;
  this.handledBy ||= this.processedBy;
  this.rejectReason ||= this.rejectionReason;
  this.rejectionReason ||= this.rejectReason;
});

schema.index({ room: 1, status: 1, createdAt: -1 });

export default mongoose.models.RentalRequest || mongoose.model('RentalRequest', schema);
