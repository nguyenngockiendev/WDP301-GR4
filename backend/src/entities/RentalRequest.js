import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'RentalRequest',
  {
    tenant: ref('User'),
    room: ref('Room'),
    message: { type: String, maxlength: 2000 },
    status: state('PENDING ACCEPTED REJECTED CANCELLED', 'PENDING'),
    handledBy: ref('User', false),
    handledAt: Date,
    rejectionReason: String,
  },
  [
    [
      { tenant: 1, room: 1 },
      { unique: true, partialFilterExpression: { status: 'PENDING' } },
    ],
    [{ room: 1, status: 1, createdAt: -1 }, {}],
  ],
);
