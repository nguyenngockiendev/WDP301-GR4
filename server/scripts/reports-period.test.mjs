import { getDashboard } from '../src/modules/dashboard/dashboard.service.js';
import UtilityReadings from '../src/models/UtilityReadings.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Users from '../src/models/Users.js';
import Properties from '../src/models/Properties.js';
import ManagerAssignments from '../src/models/ManagerAssignments.js';
import Rooms from '../src/models/Rooms.js';
import Contracts from '../src/models/Contracts.js';
import Invoices from '../src/models/Invoices.js';
import Payments from '../src/models/Payments.js';
import { getReports } from '../src/modules/reports/reports.service.js';
import { validateReportQuery } from '../src/modules/reports/reports.validation.js';

test('monthly reports use Vietnam cutoffs and historical receipts without changing records', async () => {
 const db=await MongoMemoryServer.create();
 try {
  await mongoose.connect(db.getUri());
  const [owner,manager,tenant,outsider]=await Users.create(['landlord','manager','tenant','manager'].map((role,i)=>({username:`report${i}`,email:`report${i}@test.local`,fullName:`User ${i}`,role})));
  const property=await Properties.create({owner:owner.id,name:'Report',address:'Test'});
  await ManagerAssignments.create({manager:manager.id,property:property.id,assignedBy:owner.id});
  const room=await Rooms.create({property:property.id,roomNumber:'101',area:20,price:1000});
  const contract=await Contracts.create({room:room.id,representative:tenant.id,startDate:new Date('2026-01-01'),endDate:new Date('2027-01-01'),monthlyRent:1000,depositAmount:10000,createdBy:owner.id});
  const [old,current,cancelled]=await Invoices.create(['2026-08','2026-09','2026-07'].map((billingMonth,i)=>({contract:contract.id,billingMonth,totalAmount:i===0?500:1000,paidAmount:1000,status:i===2?'cancelled':'paid',dueDate:new Date('2026-09-05'),createdBy:owner.id})));
  for(const invoice of [old,current,cancelled]) await Invoices.collection.updateOne({_id:invoice._id},{$set:{createdAt:new Date('2026-08-01')}});
  await Payments.create([
   {invoice:old.id,payer:tenant.id,method:'cash',amount:200,status:'success',paidAt:new Date('2026-08-20')},
   {invoice:old.id,payer:tenant.id,method:'cash',amount:300,status:'success',paidAt:new Date('2026-09-01T00:00:00+07:00')},
   {invoice:current.id,payer:tenant.id,amount:400,status:'success',paidAt:new Date('2026-09-30T23:59:59+07:00')},
   {invoice:current.id,payer:tenant.id,amount:600,status:'success',paidAt:new Date('2026-10-01T00:00:00+07:00')},
   {invoice:current.id,payer:tenant.id,amount:900,status:'failed',paidAt:new Date('2026-09-10')},
   {invoice:current.id,payer:tenant.id,amount:900,status:'pending',paidAt:new Date('2026-09-10')},
  ]);
  await UtilityReadings.create({room:room.id,billingMonth:'2026-09',oldElectricity:100,newElectricity:125,oldWater:10,newWater:13,recordedBy:manager.id});
  const otherRoom=await Rooms.create({property:property.id,roomNumber:'102',area:20,price:1000});
  await UtilityReadings.create({room:otherRoom.id,billingMonth:'2026-09',oldElectricity:100,newElectricity:90,oldWater:10,newWater:10,recordedBy:manager.id});
  const query=validateReportQuery({month:'2026-09'});
  const identity = user => ({ userId: user.id, role: user.role });
  const managerDashboard = await getDashboard(identity(manager), { propertyId: property.id });
  assert.equal(managerDashboard.selectedPropertyId, property.id);
  assert.equal(managerDashboard.roomStats.total, 2);
  assert.equal(managerDashboard.revenue.length, 6);
  assert.equal(managerDashboard.user.role, 'manager');
  assert.equal((await getDashboard(identity(outsider))).roomStats.total, 0);
  await assert.rejects(getDashboard(identity(outsider), { propertyId: property.id }), error => error.status === 403);
  await assert.rejects(getDashboard(identity(tenant), { propertyId: property.id }), error => error.status === 400);
  const tenantDashboard = await getDashboard(identity(tenant));
  assert.equal(tenantDashboard.user.role, 'tenant');
  assert.equal(tenantDashboard.contracts.length, 1);
  assert.equal(tenantDashboard.finance.recentPayments.length, 4);
  const before=JSON.stringify(await Invoices.find().lean());
  const report=await getReports(manager.id,query);const row=report.rows[0];
  assert.equal(row.electricityTotal,25);assert.equal(row.electricityRooms,1);assert.equal(row.electricityAverage,25);
  assert.equal(row.waterTotal,3);assert.equal(row.waterRooms,2);assert.equal(row.waterAverage,1.5);
  assert.equal(row.openingBalance,300);assert.equal(row.invoiced,1000);assert.equal(row.received,700);
  assert.equal(row.outstanding,600);assert.equal(row.overdue,600);assert.equal(report.provisional,false);
  assert.equal(report.asOf.toISOString(),'2026-09-30T16:59:59.999Z');
  assert.equal(JSON.stringify(await Invoices.find().lean()),before);
  assert.equal((await getReports(outsider.id,query)).rows.length,0);
  await assert.rejects(getReports(tenant.id,query),e=>e.status===403);
  await assert.rejects(getReports(outsider.id,{...query,propertyId:property.id}),e=>e.status===403);
  await assert.rejects(getReports(manager.id,{month:'2099-01'}),e=>e.status===400);
  assert.throws(()=>validateReportQuery({month:'2026-13'}));
  const october=(await getReports(owner.id,{month:'2026-10'})).rows[0];
  assert.equal(october.electricityAverage,null);
  assert.equal(october.openingBalance,600);assert.equal(october.received,600);assert.equal(october.outstanding,0);
  const month=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}).slice(0,7);
  assert.equal((await getReports(owner.id,{month})).provisional,true);
 } finally { await mongoose.disconnect();await db.stop(); }
});
