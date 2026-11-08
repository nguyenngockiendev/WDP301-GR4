import * as roomsService from '../src/modules/rooms/rooms.service.js';
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Users from '../src/models/Users.js';
import Properties from '../src/models/Properties.js';
import Rooms from '../src/models/Rooms.js';
import Templates from '../src/models/ContractTemplates.js';
import Assignments from '../src/models/ManagerAssignments.js';
import * as templates from '../src/modules/contracttemplates/contracttemplates.service.js';
import * as contracts from '../src/modules/contracts/contracts.service.js';

let database, owner, manager, outsider, tenant, building, otherBuilding, room, template, otherTemplate;
before(async () => {
  database = await MongoMemoryServer.create();
  await mongoose.connect(database.getUri());
  const makeUser = (username, role) => Users.create({ username, role, fullName: username, email: username + '@test.local', status: 'active' });
  const landlord = await makeUser('owner', 'landlord');
  const assigned = await makeUser('manager', 'manager');
  const unassigned = await makeUser('outsider', 'manager');
  tenant = await makeUser('tenant', 'tenant');
  owner = { userId: landlord.id, role: 'landlord' };
  manager = { userId: assigned.id, role: 'manager' };
  outsider = { userId: unassigned.id, role: 'manager' };
  building = await Properties.create({ owner: landlord.id, name: 'A', address: 'Building A', contractPolicy: { paymentDueDay: 12, paymentGraceDays: 4, depositMonths: 2 }, utilityRate: { electricityPrice: 4100, waterPrice: 21000 } });
  otherBuilding = await Properties.create({ owner: landlord.id, name: 'B', address: 'Building B' });
  await Assignments.create({ manager: assigned.id, property: building.id, assignedBy: landlord.id });
  room = await Rooms.create({ property: building.id, roomNumber: '101', area: 25, price: 3000000 });
  template = await templates.createTemplate({ title: 'A template', content: '{{propertyName}} {{tenantName}} {{paymentDueDay}} {{electricityPrice}}', property: building.id }, owner);
  otherTemplate = await templates.createTemplate({ title: 'B template', content: 'Other', property: otherBuilding.id }, owner);
});
after(async () => { await mongoose.disconnect(); await database?.stop(); });

test('only owner configures templates and must choose a building', async () => {
  await assert.rejects(templates.createTemplate({ title: 'Bad', content: 'Bad', property: building.id }, manager), e => e.status === 403);
  await assert.rejects(templates.createTemplate({ title: 'Missing', content: 'Missing' }, owner), e => e.status === 400);
});

test('assigned manager sees only active templates for their building', async () => {
  const list = await templates.getTemplates(manager);
  assert.deepEqual(list.map(t => t.id), [template.id]);
  await assert.rejects(templates.getTemplateById(otherTemplate.id, manager), e => e.status === 403);
  await assert.rejects(contracts.getContractFormOptions(building.id, outsider), e => e.status === 403);
  const options = await contracts.getContractFormOptions(building.id, manager);
  assert.deepEqual(options.templates.map(t => t.id), [template.id]);
  assert.equal(options.contractPolicy.depositMonths, 2);
});

test('manager cannot use a template from another building, even with same owner', async () => {
  await assert.rejects(contracts.createContract({ room: room.id, template: otherTemplate.id }, manager), e => e.status === 403);
  await Templates.findByIdAndUpdate(template.id, { status: 'inactive' });
  await assert.rejects(contracts.createContract({ room: room.id, template: template.id }, manager), e => e.status === 400);
  await Templates.findByIdAndUpdate(template.id, { status: 'active' });
});

test('manager fills tenant information and saves owner template and policy snapshots', async () => {
  const contract = await contracts.createContract({ room: room.id, template: template.id, representative: tenant.id, monthlyRent: 3000000, depositAmount: 6000000, startDate: '2026-11-10', endDate: '2027-11-10' }, manager);
  assert.equal(contract.paymentDueDay, 12);
  assert.equal(contract.paymentGraceDays, 4);
  assert.equal(contract.utilityRateSnapshot.electricityPrice, 4100);
  await templates.updateTemplate(template.id, { content: 'Changed' }, owner);
  await Properties.findByIdAndUpdate(building.id, { 'utilityRate.electricityPrice': 9000, 'contractPolicy.paymentDueDay': 20 });
  const document = await contracts.getContractDocument(contract.id, manager);
  assert.equal(document.content.includes('Changed'), false);
  assert.ok(JSON.stringify(document).includes('4.100'));
  assert.equal((await Rooms.findById(room.id)).status, 'occupied');
});


test('room form saves populated property payload and all editable fields', async () => {
  const populated = await roomsService.getRoomById(room.id);
  const payload = { ...populated.toObject(), roomNumber: 'Phòng 102', area: 24, price: 3800000,
    maxTenants: 2, description: 'Phòng đẹp thoáng', facilities: ['Máy lạnh', 'Wifi', 'Máy giặt'] };
  await roomsService.updateRoom(room.id, payload, manager);
  const saved = await Rooms.findById(room.id);
  assert.equal(String(saved.property), building.id);
  assert.equal(saved.roomNumber, 'Phòng 102');
  assert.equal(saved.area, 24);
  assert.equal(saved.price, 3800000);
  assert.equal(saved.maxTenants, 2);
  assert.equal(saved.description, 'Phòng đẹp thoáng');
  assert.deepEqual([...saved.facilities], ['Máy lạnh', 'Wifi', 'Máy giặt']);
  await roomsService.updateRoom(room.id, { facilities: ['Wifi'] }, manager);
  assert.deepEqual([...(await Rooms.findById(room.id)).facilities], ['Wifi']);
});

test('room update rejects unauthorized buildings and duplicate room numbers', async () => {
  await assert.rejects(roomsService.updateRoom(room.id, { description: 'Bad' }, outsider), e => e.status === 403);
  await assert.rejects(roomsService.updateRoom(room.id, { property: { _id: otherBuilding.id } }, manager), e => e.status === 403);
  const duplicate = await Rooms.create({ property: building.id, roomNumber: '201', area: 25, price: 2000000 });
  await assert.rejects(roomsService.updateRoom(room.id, { roomNumber: duplicate.roomNumber }, manager), e => e.status === 400);
  await assert.rejects(roomsService.updateRoom(room.id, { roomNumber: '' }, manager), e => e.status === 400);
  assert.equal((await Rooms.findById(room.id)).roomNumber, 'Phòng 102');
});
