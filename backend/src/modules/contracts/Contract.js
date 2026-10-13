import { entity, ref, money, state, shortText } from '../../common/models/fields.js';
export default entity(
  'Contract',
  {
    code: shortText,
    room: ref('Room'),
    building: ref('Building'),
    tenant: ref('User'),
    occupants: [ref('User')],
    occupantCount: { type: Number, min: 1, default: 1, validate: Number.isInteger },
    rentalRequest: ref('RentalRequest', false),
    previousContract: ref('Contract', false),
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    rent: money(),
    deposit: money(),
    policySnapshot: {
      minMonths: Number,
      version: Number,
      terms: String,
      noticeDays: Number,
      paymentDueDay: Number,
      paymentGraceDays: Number,
    },
    feesSnapshot: [
      {
        code: shortText,
        name: shortText,
        unit: state('MONTH PERSON USAGE', 'MONTH'),
        usageUnit: String,
        price: money(),
      },
    ],
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
        this.invalidate('endDate', 'Ngày kết thúc phải sau ngày bắt đầu.');
      this.occupiesRoom = ['APPROVED', 'ACTIVE'].includes(this.status);
    });
  },
);
