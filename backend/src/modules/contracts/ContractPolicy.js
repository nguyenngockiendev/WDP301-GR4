import { entity, ref } from '../../common/models/fields.js';
export default entity(
  'ContractPolicy',
  {
    building: ref('Building'),
    version: { type: Number, required: true, min: 1, validate: Number.isInteger },
    minMonths: { type: Number, required: true, min: 1, validate: Number.isInteger },
    noticeDays: { type: Number, required: true, min: 0, validate: Number.isInteger },
    paymentDueDay: { type: Number, required: true, min: 1, max: 31, validate: Number.isInteger },
    paymentGraceDays: { type: Number, required: true, min: 0, max: 31, validate: Number.isInteger },
    terms: { type: String, required: true, maxlength: 20000 },
    createdBy: ref('User'),
  },
  [[{ building: 1, version: 1 }, { unique: true }]],
);
