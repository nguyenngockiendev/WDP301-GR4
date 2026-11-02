import mongoose from 'mongoose';

const reference = model => ({ type: mongoose.Schema.Types.ObjectId, ref: model });
const schema = new mongoose.Schema(
  {
    recipient: { ...reference('User'), required: true },
    type: {
      type: String,
      enum: ['GENERAL', 'INVOICE', 'REMINDER', 'CONTRACT', 'CHECKOUT', 'general'],
      default: 'GENERAL',
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, trim: true },
    body: { type: String, trim: true, maxlength: 5000 },
    related: {
      entityType: { type: String, trim: true },
      entityId: mongoose.Schema.Types.ObjectId,
    },
    invoice: reference('Invoice'),
    contract: reference('Contract'),
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.body ||= this.content;
  this.content ||= this.body;
  if (this.readAt) this.isRead = true;
  if (this.isRead && !this.readAt) this.readAt = new Date();
});

schema.path('body').validate(function () {
  return Boolean(this.body || this.content);
}, 'Notification content is required.');
schema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', schema);
