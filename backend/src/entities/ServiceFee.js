import { entity, ref, money, state, shortText } from './fields.js';
export default entity(
  'ServiceFee',
  {
    building: ref('Building'),
    code: shortText,
    name: shortText,
    unit: state('MONTH PERSON USAGE', 'MONTH'),
    usageUnit: { type: String, trim: true, maxlength: 30 },
    price: money(),
    active: { type: Boolean, default: true },
  },
  [[{ building: 1, code: 1 }, { unique: true }]],
);
