import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Users from '../src/models/Users.js';
import Properties from '../src/models/Properties.js';
import Rooms from '../src/models/Rooms.js';
import Contracts from '../src/models/Contracts.js';
import Invoices from '../src/models/Invoices.js';
import Notifications from '../src/models/Notifications.js';
import { notifyOverdueInvoices } from '../src/modules/notifications/notifications-jobs.service.js';

test('overdue notices respect Vietnam days, grace period, recipient, daily dedup and payment state',async()=>{
 const db=await MongoMemoryServer.create();
 try {
  await mongoose.connect(db.getUri());await Notifications.init();
  const [owner,tenant,representative]=await Users.create(['landlord','tenant','tenant'].map((role,i)=>({username:'due'+i,email:`due${i}@test.local`,fullName:'User '+i,role})));
  const property=await Properties.create({owner:owner.id,name:'Test',address:'Test'});
  const room=await Rooms.create({property:property.id,roomNumber:'101',area:20,price:1000000});
  const contract=await Contracts.create({room:room.id,representative:representative.id,startDate:new Date('2026-01-01'),endDate:new Date('2027-01-01'),monthlyRent:1000000,paymentGraceDays:3,createdBy:owner.id});
  const invoice=await Invoices.create({contract:contract.id,billedTo:tenant.id,billingMonth:'2026-10',totalAmount:1110000,paidAmount:100000,dueDate:new Date('2026-11-05T00:00:00+07:00'),sentAt:new Date('2026-11-01'),createdBy:owner.id});
  await notifyOverdueInvoices(new Date('2026-11-08T23:59:59+07:00'));
  assert.equal(await Notifications.countDocuments(),0);
  const day4=new Date('2026-11-09T00:00:00+07:00');
  await Promise.all([notifyOverdueInvoices(day4),notifyOverdueInvoices(day4)]);
  assert.equal(await Notifications.countDocuments(),1);
  const notice=await Notifications.findOne();assert.equal(notice.recipient.toString(),tenant.id);
  assert.match(notice.title,/4 ngày/);assert.match(notice.content,/1\.010\.000/);
  await notifyOverdueInvoices(new Date('2026-11-09T23:59:59+07:00'));
  assert.equal(await Notifications.countDocuments(),1);
  await notifyOverdueInvoices(new Date('2026-11-10T00:00:00+07:00'));
  assert.equal(await Notifications.countDocuments(),2);
  for(const update of [{paidAmount:1110000},{paidAmount:0,status:'paid'},{status:'cancelled'},{status:'unpaid',sentAt:null}]){
   await Invoices.updateOne({_id:invoice.id},update);
   await notifyOverdueInvoices(new Date('2026-11-11T00:00:00+07:00'));
   assert.equal(await Notifications.countDocuments(),2);
  }
  await Invoices.updateOne({_id:invoice.id},{status:'unpaid',sentAt:new Date('2026-11-01')});
  await Users.updateOne({_id:tenant.id},{status:'inactive'});
  await notifyOverdueInvoices(new Date('2026-11-11T00:00:00+07:00'));
  assert.equal(await Notifications.countDocuments(),2);
 }finally{await mongoose.disconnect();await db.stop();}
});
