import mongoose from 'mongoose';
import { entity, ref, money, quantity, state, shortText } from './fields.js';
export default entity(
  'Invoice',
  {
    code: shortText,
    contract: ref('Contract'),
    room: ref('Room'),
    building: ref('Building'),
    tenant: ref('User'),
    period: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/ },
    reading: ref('UtilityReading', false),
    lines: {
      type: [
        {
          description: shortText,
          kind: state('RENT ELECTRICITY WATER SERVICE OTHER', 'RENT'),
          quantity: quantity,
          unitPrice: money(),
          amount: money(),
        },
      ],
      validate: v => v.length > 0,
    },
    adjustments: [
      {
        amount: { type: Number, required: true, validate: Number.isSafeInteger },
        reason: { type: String, required: true, trim: true, maxlength: 500 },
        adjustedBy: ref('User'),
        adjustedAt: { type: Date, default: Date.now },
      },
    ],
    total: money(),
    paidAmount: { ...money(), default: 0 },
    status: state('DRAFT ISSUED PARTIAL PAID VOID', 'DRAFT'),
    dueDate: { type: Date, required: true },
    issuedAt: Date,
    createdBy: ref('User'),
  },
  [
    [{ code: 1 }, { unique: true }],
    [{ contract: 1, period: 1 }, { unique: true }],
    [{ tenant: 1, status: 1, dueDate: 1 }, {}],
    [{ building: 1, period: 1 }, {}],
  ],
  schema => {
    schema.pre('validate', function () {
      const sum =
        this.lines.reduce((n, l) => n + l.amount, 0) +
        this.adjustments.reduce((n, adjustment) => n + adjustment.amount, 0);
      if (sum !== this.total) this.invalidate('total', 'Tổng tiền không khớp các dòng');
      if (this.paidAmount > this.total)
        this.invalidate('paidAmount', 'Tiền VNDã trả vượt tổng hóa VNDơn');
      for (const line of this.lines)
        if (line.amount !== Math.round(line.quantity * line.unitPrice))
          this.invalidate('lines', 'Thành tiền phải bằng số lượng nhân VNDơn giá, làm tròn VNĐ');
    });
  },
);
