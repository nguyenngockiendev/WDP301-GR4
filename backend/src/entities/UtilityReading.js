import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'UtilityReading',
  {
    room: ref('Room'),
    contract: ref('Contract'),
    period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    electricityPrevious: quantity,
    electricityCurrent: quantity,
    waterPrevious: quantity,
    waterCurrent: quantity,
    recordedBy: ref('User'),
    recordedAt: { type: Date, default: Date.now },
  },
  [[{ room: 1, period: 1 }, { unique: true }]],
  schema => {
    schema.pre('validate', function () {
      for (const key of ['electricity', 'water'])
        if (this[key + 'Current'] < this[key + 'Previous'])
          this.invalidate(key + 'Current', 'Chỉ số mới phải >= chỉ số cũ');
    });
  },
);
