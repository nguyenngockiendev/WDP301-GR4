import mongoose from 'mongoose';
export const ref = (model, required = true) => ({
  type: mongoose.Schema.Types.ObjectId,
  ref: model,
  required,
});
export const money = (required = true) => ({
  type: Number,
  required,
  min: 0,
  max: Number.MAX_SAFE_INTEGER,
  validate: Number.isSafeInteger,
});
export const quantity = { type: Number, required: true, min: 0, validate: Number.isFinite };
export const state = (values, initial) => ({
  type: String,
  enum: values.split(' '),
  default: initial,
  required: true,
});
export const shortText = { type: String, required: true, trim: true, maxlength: 200 };
export function entity(name, fields, indexes = [], configure) {
  const schema = new mongoose.Schema(fields, { timestamps: true, optimisticConcurrency: true });
  for (const [keys, options] of indexes) schema.index(keys, options);
  if (configure) configure(schema);
  return mongoose.model(name, schema);
}
