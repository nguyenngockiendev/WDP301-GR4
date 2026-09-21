import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'CheckoutRequest',
  {
    contract: ref('Contract'),
    tenant: ref('User'),
    requestedDate: { type: Date, required: true },
    reason: { type: String, maxlength: 2000 },
    status: state('PENDING APPROVED REJECTED COMPLETED CANCELLED', 'PENDING'),
    handledBy: ref('User', false),
    handledAt: Date,
  },
  [
    [
      { contract: 1 },
      { unique: true, partialFilterExpression: { status: { $in: ['PENDING', 'APPROVED'] } } },
    ],
    [{ tenant: 1, createdAt: -1 }, {}],
  ],
);
