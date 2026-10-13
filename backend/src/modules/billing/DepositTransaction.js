import { entity, ref, money, state, shortText } from '../../common/models/fields.js';
export default entity(
  'DepositTransaction',
  {
    contract: ref('Contract'),
    type: state('RECEIVED APPLIED REFUNDED', 'RECEIVED'),
    amount: { ...money(), min: 1 },
    idempotencyKey: shortText,
    recordedBy: ref('User'),
    occurredAt: { type: Date, default: Date.now },
    note: String,
  },
  [
    [{ idempotencyKey: 1 }, { unique: true }],
    [{ contract: 1, occurredAt: 1 }, {}],
  ],
);
