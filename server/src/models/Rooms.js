import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null, index: true },
    building: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', default: null, index: true },
    roomNumber: { type: String, trim: true, maxlength: 50 },
    code: { type: String, trim: true, maxlength: 50 },
    area: { type: Number, min: 0 },
    maxTenants: { type: Number, min: 1, validate: Number.isInteger },
    capacity: { type: Number, min: 1, validate: Number.isInteger },
    facilities: [{ type: String, trim: true, maxlength: 100 }],
    amenities: [{ type: String, trim: true, maxlength: 100 }],
    serviceFees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceFee' }],
    images: [{ type: String }],
    title: { type: String, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['VACANT', 'RESERVED', 'OCCUPIED', 'MAINTENANCE', 'available', 'occupied', 'maintenance', 'reserved'],
      default: 'VACANT',
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  },
  { timestamps: true },
);

schema.pre('validate', function () {
  this.code ||= this.roomNumber;
  this.roomNumber ||= this.code;
  this.capacity ??= this.maxTenants;
  this.maxTenants ??= this.capacity;
  if (!this.title) this.title = this.code || this.roomNumber || 'Room';
  if (!this.amenities.length) this.amenities = this.facilities;
  if (!this.facilities.length) this.facilities = this.amenities;
});

schema.index(
  { building: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { building: { $type: 'objectId' }, code: { $type: 'string' } },
  },
);
schema.index(
  { property: 1, roomNumber: 1 },
  {
    unique: true,
    partialFilterExpression: { property: { $type: 'objectId' }, roomNumber: { $type: 'string' } },
  },
);
schema.index({ building: 1, status: 1 });

export default mongoose.models.Room || mongoose.model('Room', schema);
