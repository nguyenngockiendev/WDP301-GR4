import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'Contract',
  {
    code: shortText,
    room: ref('Room'),
    building: ref('Building'),
    tenant: ref('User'),
    occupants: [ref('User')],
    rentalRequest: ref('RentalRequest', false),
    previousContract: ref('Contract', false),
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rent: money(),
    deposit: money(),
    policySnapshot: { version: Number, terms: String, noticeDays: Number },
    feesSnapshot: [{ name: shortText, unit: state('MONTH PERSON USAGE', 'MONTH'), price: money() }],
    status: state('DRAFT PENDING APPROVED ACTIVE REJECTED ENDED CANCELLED', 'DRAFT'),
    occupiesRoom: { type: Boolean, default: false },
    createdBy: ref('User'),
    approvedBy: ref('User', false),
    approvedAt: Date,
  },
  [
    [{ code: 1 }, { unique: true }],
    [{ room: 1 }, { unique: true, partialFilterExpression: { occupiesRoom: true } }],
    [{ tenant: 1, status: 1 }, {}],
    [{ building: 1, status: 1 }, {}],
  ],
  schema => {
    schema.pre('validate', function () {
      if (this.endDate <= this.startDate)
        this.invalidate('endDate', 'Ngày kết thúc phải sau ngày bắt VNDầu');
      this.occupiesRoom = ['APPROVED', 'ACTIVE'].includes(this.status);
    });
  },
);
