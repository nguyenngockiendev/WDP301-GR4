import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import router from '../src/modules/notifications/notifications.route.js';
import Notifications from '../src/models/Notifications.js';

let database;
const app = express();
app.use(express.json());
app.use('/api/notifications', router);
app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
const owner = new mongoose.Types.ObjectId();
const other = new mongoose.Types.ObjectId();
let token;
let ownId;
let otherId;
before(async () => {
  process.env.JWT_SECRET = 'notifications-isolated-test-secret';
  token = jwt.sign({ userId: owner.toString(), role: 'tenant' }, process.env.JWT_SECRET);
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  const records = await Notifications.create([
    { recipient: owner, title: 'First', content: 'One', createdAt: new Date('2026-01-01') },
    { recipient: owner, title: 'Second', content: 'Two', createdAt: new Date('2026-01-02') },
    { recipient: other, title: 'Private', content: 'Other user' },
  ]);
  ownId = records[0].id;
  otherId = records[2].id;
});
after(async () => { await mongoose.disconnect(); await database?.stop(); });
const auth = () => `Bearer ${token}`;

test('requires a valid authenticated identity', async () => {
  await request(app).get('/api/notifications').expect(401);
  await request(app).get('/api/notifications').set('Authorization', 'Bearer broken').expect(401);
  const expired = jwt.sign({ userId: owner.toString() }, process.env.JWT_SECRET, { expiresIn: -1 });
  await request(app).get('/api/notifications').set('Authorization', `Bearer ${expired}`).expect(401);
});
test('scopes results and counts to recipient, paginates newest first', async () => {
  const { body } = await request(app).get(`/api/notifications?limit=1&recipient=${other}`).set('Authorization', auth()).expect(200);
  assert.equal(body.data.total, 2);
  assert.equal(body.data.unreadCount, 2);
  assert.equal(body.data.items[0].title, 'Second');
  assert.equal(body.data.totalPages, 2);
});
test('rejects malformed filters and identifiers', async () => {
  for (const query of ['page=0', 'limit=101', 'status=bad', 'page=1.5']) {
    await request(app).get(`/api/notifications?${query}`).set('Authorization', auth()).expect(400);
  }
  await request(app).patch('/api/notifications/invalid/read').set('Authorization', auth()).expect(400);
});
test('cannot mark another recipient notification as read', async () => {
  await request(app).patch(`/api/notifications/${otherId}/read`).set('Authorization', auth()).expect(404);
  assert.equal((await Notifications.findById(otherId)).isRead, false);
});
test('mark read is repeatable and filters reflect changes', async () => {
  for (let i = 0; i < 2; i++) await request(app).patch(`/api/notifications/${ownId}/read`).set('Authorization', auth()).expect(200);
  const { body } = await request(app).get('/api/notifications?status=read').set('Authorization', auth()).expect(200);
  assert.equal(body.data.total, 1);
  assert.equal(body.data.unreadCount, 1);
});
test('mark all only affects own unread records', async () => {
  const { body } = await request(app).patch('/api/notifications/read-all').set('Authorization', auth()).expect(200);
  assert.equal(body.data.modifiedCount, 1);
  const count = await request(app).get('/api/notifications/unread-count').set('Authorization', auth()).expect(200);
  assert.equal(count.body.data.unreadCount, 0);
  assert.equal((await Notifications.findById(otherId)).isRead, false);
});
