import { entity, ref, money } from '../../common/models/fields.js';
export default entity(
  'RentRate',
  {
    room: ref('Room'),
    amount: money(),
    effectiveFrom: { type: Date, required: true },
    createdBy: ref('User'),
  },
  [[{ room: 1, effectiveFrom: 1 }, { unique: true }]],
);
