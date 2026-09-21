import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'Notification',
  {
    recipient: ref('User'),
    type: state('GENERAL INVOICE REMINDER CONTRACT CHECKOUT', 'GENERAL'),
    title: shortText,
    body: { type: String, required: true, maxlength: 5000 },
    invoice: ref('Invoice', false),
    contract: ref('Contract', false),
    readAt: Date,
  },
  [[{ recipient: 1, readAt: 1, createdAt: -1 }, {}]],
);
