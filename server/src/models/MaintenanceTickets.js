import mongoose from 'mongoose';

const maintenanceTicketSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    status: {
      type: String,
      enum: ['reported', 'approved', 'in_progress', 'completed', 'rejected'],
      default: 'reported',
    },
    estimatedCost: { type: Number, min: 0, default: 0 },
    actualCost: { type: Number, min: 0, default: 0 },
    resolutionNote: { type: String, trim: true, maxlength: 1500, default: '' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: String, trim: true, maxlength: 120, default: '' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

maintenanceTicketSchema.index({ property: 1, status: 1, createdAt: -1 });

export default mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
