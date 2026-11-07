import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import router from '../src/modules/notifications/notifications.route.js';
import Users from '../src/models/Users.js';
import Properties from '../src/models/Properties.js';
import Rooms from '../src/models/Rooms.js';
import Contracts from '../src/models/Contracts.js';
import ManagerAssignments from '../src/models/ManagerAssignments.js';

const app = express();
app.use(express.json());
app.use('/notifications', router);
let database;
let owner, other, manager, tenant, member, empty, property, foreign;
const auth = user =>
  `Bearer ${jwt.sign({ userId: user.id, role: 'landlord' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
before(async () => {
  process.env.JWT_SECRET = 'dashboard-test-only';
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  const roles = ['landlord', 'landlord', 'manager', 'tenant', 'tenant', 'landlord'];
  [owner, other, manager, tenant, member, empty] = await Users.create(
    roles.map((role, i) => ({
      username: `user${i}`,
      email: `u${i}@test.local`,
      password: 'unused',
      fullName: `User ${i}`,
      role,
    })),
  );
  [property, foreign] = await Properties.create([
    { owner: owner.id, name: 'Own', address: 'A' },
    { owner: other.id, name: 'Foreign', address: 'B' },
  ]);
  const rooms = await Rooms.create(
    [property, foreign].map(item => ({
      property: item.id,
      roomNumber: '101',
      area: 20,
      price: 100,
      status: 'occupied',
    })),
  );
  await ManagerAssignments.create([
    { manager: manager.id, property: property.id, assignedBy: owner.id },
    { manager: manager.id, property: foreign.id, assignedBy: other.id, status: 'inactive' },
  ]);
  const now = Date.now();
  await Contracts.create(
    rooms.map((room, i) => ({
      room: room.id,
      representative: i ? other.id : tenant.id,
      otherMembers: i ? [] : [member.id],
      startDate: new Date(now - 86400000),
      endDate: new Date(now + 86400000 * 10),
      monthlyRent: 100,
      createdBy: owner.id,
    })),
  );
});
after(async () => {
  await mongoose.disconnect();
  await database?.stop();
});

const payload = () => ({
  recipientId: tenant.id,
  propertyId: property.id,
  title: 'Thông báo',
  content: 'Kiểm tra đường nước',
});
test('management requires manager role and lists representative and members', async () => {
  await request(app).get('/notifications/recipients').expect(401);
  for (const user of [tenant, owner]) {
    await request(app)
      .get('/notifications/recipients')
      .set('Authorization', auth(user))
      .expect(403);
    await request(app)
      .post('/notifications/send')
      .set('Authorization', auth(user))
      .send(payload())
      .expect(403);
  }
  const { body } = await request(app)
    .get('/notifications/recipients')
    .set('Authorization', auth(manager))
    .expect(200);
  assert.deepEqual(body.data.map(item => item.recipientId).sort(), [tenant.id, member.id].sort());
});
test('rejects invalid input and recipients outside assigned property', async () => {
  for (const change of [
    { title: ' ' },
    { content: 'x'.repeat(5001) },
    { recipientId: [tenant.id] },
  ]) {
    await request(app)
      .post('/notifications/send')
      .set('Authorization', auth(manager))
      .send({ ...payload(), ...change })
      .expect(400);
  }
  await request(app)
    .post('/notifications/send')
    .set('Authorization', auth(manager))
    .send({ ...payload(), propertyId: foreign.id })
    .expect(403);
  await request(app)
    .post('/notifications/send')
    .set('Authorization', auth(manager))
    .send({ ...payload(), recipientId: other.id })
    .expect(403);
});
test('sending persists unread notification and sender history tracks read state', async () => {
  const { body } = await request(app)
    .post('/notifications/send')
    .set('Authorization', auth(manager))
    .send(payload())
    .expect(201);
  assert.equal(body.data.sender, manager.id);
  assert.equal(body.data.isRead, false);
  const inbox = await request(app)
    .get('/notifications')
    .set('Authorization', auth(tenant))
    .expect(200);
  assert.equal(inbox.body.data.items[0]._id, body.data._id);
  await request(app)
    .patch(`/notifications/${body.data._id}/read`)
    .set('Authorization', auth(tenant))
    .expect(200);
  const sent = await request(app)
    .get('/notifications/sent')
    .set('Authorization', auth(manager))
    .expect(200);
  assert.equal(sent.body.data.total, 1);
  assert.equal(sent.body.data.items[0].isRead, true);
});
test('expired contract and revoked assignment prevent new sends', async () => {
  await Contracts.updateMany({ representative: tenant.id }, { status: 'expired' });
  await request(app)
    .post('/notifications/send')
    .set('Authorization', auth(manager))
    .send(payload())
    .expect(403);
  await ManagerAssignments.updateMany({ manager: manager.id }, { status: 'removed' });
  const sent = await request(app)
    .get('/notifications/sent')
    .set('Authorization', auth(manager))
    .expect(200);
  assert.equal(sent.body.data.total, 0);
});
