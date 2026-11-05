import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

test('real login issues JWT, API requires bearer token and rejects cookie-only requests', async t => {
  process.env.JWT_SECRET = 'isolated-jwt-integration-secret';
  process.env.NODE_ENV = 'test';
  const { default: app } = await import('../src/app/app.js');
  const { default: Users } = await import('../src/models/Users.js');
  const database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  t.after(async () => {
    await mongoose.disconnect();
    await database.stop();
  });
  await Users.create({
    username: 'sessiontest',
    email: 'session@example.test',
    fullName: 'Session Test',
    password: await bcrypt.hash('TestPassword123', 10),
    role: 'tenant',
  });
  const login = await request(app)
    .post('/api/auth/login')
    .set('Origin', 'http://127.0.0.1:3000')
    .send({ email: 'session@example.test', password: 'TestPassword123' })
    .expect(200);
  const token = login.body.data.user;
  assert.equal(typeof token, 'string');
  assert.equal(login.headers['set-cookie'], undefined);
  await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer ' + token)
    .expect(200);
  const list = await request(app)
    .get('/api/notifications')
    .set('Authorization', 'Bearer ' + token)
    .expect(200);
  assert.equal(list.body.data.total, 0);
  await request(app).get('/api/notifications').set('Cookie', 'connect.sid=old-session').expect(401);
});
