import mongoose from 'mongoose';
const schema = new mongoose.Schema(
  {
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', default: null, index: true },
    code: { type: String, trim: true, maxlength: 50 },
    area: { type: Number, min: 0 },
    capacity: { type: Number, min: 1, validate: Number.isInteger },
    title: { type: String, required: true, maxlength: 150 },
    description: { type: String, required: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['VACANT', 'OCCUPIED', 'MAINTENANCE'], default: 'VACANT' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true },
);
schema.index(
  { building: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { building: { $type: 'objectId' }, code: { $type: 'string' } },
  },
);
schema.index({ building: 1, status: 1 });
export default mongoose.model('Room', schema);
