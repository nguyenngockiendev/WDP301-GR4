import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as M from '../src/entities/index.js';
let mongo;
const id = () => new mongoose.Types.ObjectId();
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  for (const model of Object.values(M)) await model.init();
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
const contractData = () => ({
  code: String(id()),
  room: id(),
  building: id(),
  tenant: id(),
  startDate: new Date('2026-01-01'),
  endDate: new Date('2027-01-01'),
  rent: 2500000,
  deposit: 2500000,
  createdBy: id(),
});
const invoiceData = () => ({
  code: String(id()),
  contract: id(),
  room: id(),
  building: id(),
  tenant: id(),
  period: '2026-09',
  lines: [
    { description: 'Tiền phòng', kind: 'RENT', quantity: 1, unitPrice: 2500000, amount: 2500000 },
  ],
  total: 2500000,
  dueDate: new Date('2026-10-05'),
  createdBy: id(),
});
test('All domain models compile; invalid money, dates and meter readings rejected', async () => {
  assert.equal(Object.keys(M).length, 20);
  await assert.rejects(new M.Contract({ ...contractData(), rent: 1.5 }).validate());
  await assert.rejects(
    new M.Contract({ ...contractData(), endDate: new Date('2025-01-01') }).validate(),
  );
  await assert.rejects(
    new M.UtilityReading({
      room: id(),
      contract: id(),
      period: '2026-13',
      electricityPrevious: 10,
      electricityCurrent: 9,
      waterPrevious: 0,
      waterCurrent: 1,
      recordedBy: id(),
    }).validate(),
  );
});
test('Only one occupying contract per room; room released when ended', async () => {
  const data = contractData();
  const first = await M.Contract.create({ ...data, status: 'APPROVED' });
  await assert.rejects(M.Contract.create({ ...data, code: String(id()), status: 'ACTIVE' }), {
    code: 11000,
  });
  first.status = 'ENDED';
  await first.save();
  await M.Contract.create({ ...data, code: String(id()), status: 'ACTIVE' });
});
test('Invoice totals and billing period uniqueness enforced', async () => {
  const data = invoiceData();
  await M.Invoice.create(data);
  await assert.rejects(M.Invoice.create({ ...data, code: String(id()) }), { code: 11000 });
  await assert.rejects(new M.Invoice({ ...invoiceData(), total: 1 }).validate());
  await assert.rejects(new M.Invoice({ ...invoiceData(), paidAmount: 3000000 }).validate());
});
test('Payment and gateway event deduplication; OTP expiry index and hidden hash', async () => {
  const data = {
    invoice: id(),
    tenant: id(),
    amount: 100,
    method: 'GATEWAY',
    idempotencyKey: 'payment-test',
    provider: 'test',
    providerTransactionId: 'tx-1',
  };
  await M.Payment.create(data);
  await assert.rejects(M.Payment.create({ ...data, idempotencyKey: 'another-key' }), {
    code: 11000,
  });
  await M.PaymentEvent.create({ provider: 'test', eventId: 'evt-1', payloadDigest: 'digest' });
  await assert.rejects(
    M.PaymentEvent.create({ provider: 'test', eventId: 'evt-1', payloadDigest: 'digest' }),
    { code: 11000 },
  );
  const otp = await M.OtpChallenge.create({
    email: 'test@example.com',
    tokenHash: 'hash-only',
    expiresAt: new Date(Date.now() + 600000),
  });
  assert.equal((await M.OtpChallenge.findById(otp._id)).tokenHash, undefined);
  assert.ok((await M.OtpChallenge.collection.indexes()).some(i => i.expireAfterSeconds === 0));
});
test('Room codes scoped by building; legacy rooms without building remain valid', async () => {
  const data = {
    title: 'A101',
    description: 'Room',
    price: 100,
    owner: id(),
    building: id(),
    code: '101',
  };
  await M.Room.create(data);
  await assert.rejects(M.Room.create(data), { code: 11000 });
  await M.Room.create({ ...data, building: id() });
  await M.Room.create({ title: 'Legacy', description: 'Room', price: 100, owner: id() });
});
