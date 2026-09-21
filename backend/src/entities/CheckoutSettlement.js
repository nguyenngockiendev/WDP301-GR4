import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'CheckoutSettlement',
  {
    request: ref('CheckoutRequest'),
    contract: ref('Contract'),
    inspectedBy: ref('User'),
    inspectedAt: { type: Date, required: true },
    roomCondition: state('GOOD DAMAGED', 'GOOD'),
    damageNotes: String,
    outstandingDebt: money(),
    damageCharge: money(),
    depositApplied: money(),
    refundAmount: money(),
    remainingDue: money(),
    status: state('DRAFT FINALIZED', 'DRAFT'),
    finalizedAt: Date,
  },
  [
    [{ request: 1 }, { unique: true }],
    [{ contract: 1 }, { unique: true }],
  ],
);
