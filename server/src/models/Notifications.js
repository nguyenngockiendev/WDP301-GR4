import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    eventKey: { type: String },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      default: 'general',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    related: {
      entityType: {
        type: String,
        trim: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

notificationSchema.index(
  { eventKey: 1, recipient: 1 },
  { unique: true, partialFilterExpression: { eventKey: { $type: 'string' } } },
);
const Notifications = mongoose.model('Notification', notificationSchema);

export default Notifications;
