import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import session from 'express-session';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import User from '../src/entities/User.js';
import Notification from '../src/entities/Notification.js';
import { UserDAO } from '../src/dao/UserDAO.js';
import { UserService } from '../src/services/UserService.js';
import { CreateUserDTO } from '../src/dto/UserDTO.js';
let mongo, app;
const password = 'TestingPassword123!';
async function token(agent) {
  return (await agent.get('/api/session').expect(200)).body.csrf;
}
async function login(email) {
  const agent = request.agent(app);
  const csrf = await token(agent);
  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email, password })
    .expect(200);
  return agent;
}
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init();
  app = createApp({
    secret: 'test-session-secret-at-least-32-characters',
    store: new session.MemoryStore(),
  });
  for (const [email, role] of [
    ['admin@test.com', 'ADMIN'],
    ['manager@test.com', 'MANAGER'],
    ['other@test.com', 'MANAGER'],
    ['tenant@test.com', 'TENANT'],
  ])
    await new UserService(new UserDAO()).create(
      new CreateUserDTO({ name: 'Test User', email, password, role }, true),
    );
});
after(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});
test('JSON session, registration, login rotation, profile whitelist and logout', async () => {
  const agent = request.agent(app);
  const csrf = await token(agent);
  await agent.post('/api/auth/register').send({}).expect(403);
  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'New Tenant', email: 'new@test.com', password, role: 'ADMIN' })
    .expect(201);
  assert.equal((await User.findOne({ email: 'new@test.com' })).role, 'TENANT');
  await agent
    .post('/api/auth/register')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Duplicate', email: 'new@test.com', password })
    .expect(409);
  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', csrf)
    .send({ email: 'new@test.com', password })
    .expect(200);
  await agent.patch('/api/profile').set('X-CSRF-Token', csrf).send({ name: 'Changed' }).expect(403);
  const fresh = await token(agent);
  const result = await agent
    .patch('/api/profile')
    .set('X-CSRF-Token', fresh)
    .send({ name: 'Changed', role: 'ADMIN', email: 'hacked@test.com' })
    .expect(200);
  assert.equal(result.body.user.role, 'TENANT');
  assert.equal(result.body.user.email, 'new@test.com');
  await agent.post('/api/auth/logout').set('X-CSRF-Token', fresh).send({}).expect(200);
  await agent.get('/api/dashboard').expect(401);
});
test('Landlord user API rejects legacy roles and omits password hash', async () => {
  const admin = await login('admin@test.com'),
    csrf = await token(admin);
  const created = await admin
    .post('/api/users')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'New Manager', email: 'new-manager@test.com', password, role: 'MANAGER' })
    .expect(201);
  assert.equal(created.body.user.passwordHash, undefined);
  await admin.get('/api/users/' + created.body.user.id).expect(200);
  for (const role of ['EXPERT', 'PAYMENT_GATEWAY'])
    await admin
      .post('/api/users')
      .set('X-CSRF-Token', csrf)
      .send({ name: 'Invalid User', email: 'invalid@test.com', password, role })
      .expect(400);
  const tenant = await login('tenant@test.com');
  await tenant.get('/api/users').expect(403);
});
test('Room API enforces creation and assignment permissions', async () => {
  const admin = await login('admin@test.com'),
    manager = await login('manager@test.com'),
    other = await login('other@test.com');
  const csrf = await token(admin);
  await manager
    .post('/api/rooms')
    .set('X-CSRF-Token', await token(manager))
    .send({})
    .expect(403);
  const created = await admin
    .post('/api/rooms')
    .set('X-CSRF-Token', csrf)
    .send({ title: 'Room A101', description: 'Room with balcony', price: 2500000 })
    .expect(201);
  const url = '/api/rooms/' + created.body.item._id;
  await manager.get(url).expect(404);
  const target = await User.findOne({ email: 'manager@test.com' });
  await admin
    .patch(url + '/manager')
    .set('X-CSRF-Token', csrf)
    .send({ manager: String(target._id) })
    .expect(200);
  await manager.get(url).expect(200);
  await other.get(url).expect(404);
  await manager
    .patch(url + '/manager')
    .set('X-CSRF-Token', await token(manager))
    .send({ manager: '' })
    .expect(403);
  await admin
    .patch(url + '/manager')
    .set('X-CSRF-Token', csrf)
    .send({ manager: '' })
    .expect(200);
  await manager.get(url).expect(404);
});
test('Landlord can manage buildings and assign rooms to an owned building', async () => {
  const admin = await login('admin@test.com');
  const csrf = await token(admin);
  const building = await admin
    .post('/api/buildings')
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Sunrise House', address: '1 Main Street', status: 'ACTIVE' })
    .expect(201);
  const buildingId = String(building.body.item._id);
  await admin
    .patch('/api/buildings/' + buildingId)
    .set('X-CSRF-Token', csrf)
    .send({ name: 'Sunrise House', address: '2 Main Street', status: 'INACTIVE' })
    .expect(200);
  const room = await admin
    .post('/api/rooms')
    .set('X-CSRF-Token', csrf)
    .send({ title: 'Room in building', description: 'Room for building test', price: 2500000 })
    .expect(201);
  await admin
    .patch('/api/rooms/' + room.body.item._id + '/building')
    .set('X-CSRF-Token', csrf)
    .send({ building: buildingId })
    .expect(200);
  await admin
    .delete('/api/buildings/' + buildingId)
    .set('X-CSRF-Token', csrf)
    .expect(409);
  await admin
    .patch('/api/rooms/' + room.body.item._id + '/building')
    .set('X-CSRF-Token', csrf)
    .send({ building: '' })
    .expect(200);
  await admin
    .delete('/api/buildings/' + buildingId)
    .set('X-CSRF-Token', csrf)
    .expect(204);
  const manager = await login('manager@test.com');
  await manager.get('/api/buildings').expect(403);
});
test('Dashboard and workspace JSON are scoped to the signed-in user', async () => {
  const admin = await login('admin@test.com'),
    tenant = await login('tenant@test.com');
  await admin.get('/api/dashboard').expect(200);
  for (const key of [
    'buildings',
    'contracts',
    'requests',
    'readings',
    'invoices',
    'payments',
    'deposits',
    'checkouts',
    'notifications',
    'rates',
    'fees',
    'policies',
  ])
    await admin.get('/api/workspace/' + key).expect(200);
  await tenant.get('/api/workspace/rates').expect(403);
  const tu = await User.findOne({ email: 'tenant@test.com' }),
    au = await User.findOne({ email: 'admin@test.com' });
  await Notification.create({ recipient: tu._id, title: 'Tenant private', body: 'Tenant only' });
  await Notification.create({ recipient: au._id, title: 'Admin private', body: 'Admin only' });
  const result = await tenant.get('/api/workspace/notifications').expect(200);
  assert.equal(result.body.items.length, 1);
  assert.equal(result.body.items[0].title, 'Tenant private');
  assert.equal((await tenant.get('/api/session')).body.modules.rates, undefined);
});
test('Legacy roles lose an existing session and cannot log in', async () => {
  const agent = await login('other@test.com');
  const user = await User.findOne({ email: 'other@test.com' });
  await User.collection.updateOne({ _id: user._id }, { $set: { role: 'EXPERT' } });
  await agent.get('/api/dashboard').expect(401);
  await agent
    .post('/api/auth/login')
    .set('X-CSRF-Token', await token(agent))
    .send({ email: user.email, password })
    .expect(403);
});
