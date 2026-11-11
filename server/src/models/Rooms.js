import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    statusHistory: [
      {
        _id: false,
        status: {
          type: String,
          enum: ['available', 'occupied', 'maintenance', 'reserved'],
          required: true,
        },
        at: { type: Date, required: true },
      },
    ],
    name: { type: String, trim: true },
    floor: { type: Number, default: 1, min: 0 },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    maxTenants: {
      type: Number,
      default: 1,
    },
    tier: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'standard',
    },
    facilities: [
      {
        type: String,
        trim: true,
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'reserved'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.set('optimisticConcurrency', true);
// Mọi luồng đổi trạng thái hiện tại dùng room.save(), nên lưu lịch sử cùng bản ghi phòng.
roomSchema.pre('save', function () {
  if (this.isNew || this.isModified('status') || !this.statusHistory.length) {
    this.statusHistory.push({ status: this.status, at: new Date() });
  }
});
const Rooms = mongoose.model('Room', roomSchema);

export default Rooms;
