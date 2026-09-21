import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'EmailDelivery',
  {
    recipient: { type: String, required: true },
    template: state('VERIFY_ACCOUNT RESET_PASSWORD INVOICE REMINDER', 'INVOICE'),
    notification: ref('Notification', false),
    status: state('QUEUED SENT FAILED', 'QUEUED'),
    deduplicationKey: shortText,
    attempts: { type: Number, default: 0, min: 0 },
    nextAttemptAt: Date,
    sentAt: Date,
    providerMessageId: String,
    lastError: String,
  },
  [
    [{ deduplicationKey: 1 }, { unique: true }],
    [{ status: 1, nextAttemptAt: 1 }, {}],
  ],
);
