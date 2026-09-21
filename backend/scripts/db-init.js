import 'dotenv/config';
import mongoose from 'mongoose';
import * as models from '../src/entities/index.js';
try {
  if (!process.env.MONGODB_URI) throw new Error('Thiếu MONGODB_URI');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  for (const model of Object.values(models)) {
    await model.createCollection();
    await model.createIndexes();
    console.log(model.modelName + ': collection/index OK');
  }
  console.log('Database: ' + mongoose.connection.name);
} finally {
  await mongoose.disconnect();
}
