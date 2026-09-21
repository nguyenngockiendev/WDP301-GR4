import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'ServiceFee',
  {
    building: ref('Building'),
    code: shortText,
    name: shortText,
    unit: state('MONTH PERSON USAGE', 'MONTH'),
    price: money(),
    active: { type: Boolean, default: true },
  },
  [[{ building: 1, code: 1 }, { unique: true }]],
);
