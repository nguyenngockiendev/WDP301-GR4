import 'dotenv/config';
import mongoose from 'mongoose';
import Users from '../src/models/Users.js';
import Properties from '../src/models/Properties.js';
import Rooms from '../src/models/Rooms.js';
import buildings from '../src/data/demo-buildings.js';

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  const landlord = await Users.findOne({ role: 'landlord', status: 'active' });
  if (!landlord) throw new Error('Không có tài khoản landlord đang hoạt động. Hãy tạo tài khoản trước khi seed.');
  let addedProperties = 0, addedRooms = 0;
  for (const building of buildings) {
    let property = await Properties.findOne({ owner: landlord._id, name: building.name });
    if (!property) {
      property = await Properties.create({
        owner: landlord._id, name: building.name, address: building.address,
        description: building.description, image: building.image, district: building.district,
        code: building.code, totalFloors: building.totalFloors,
        utilityRate: { electricityPrice: building.electricPrice, waterPrice: building.waterPrice },
      });
      addedProperties++;
    }
    for (const room of building.rooms) {
      if (await Rooms.exists({ property: property._id, roomNumber: room.roomNumber })) continue;
      await Rooms.create({ property: property._id, roomNumber: room.roomNumber, name: room.name,
        floor: room.floor, area: Number.parseFloat(room.area), price: room.price,
        tier: room.tier === 'Phòng Deluxe' ? 'standard' : 'premium',
        facilities: room.amenities, images: [room.image], description: room.name,
        status: 'available', maxTenants: 2,
      });
      addedRooms++;
    }
  }
  console.log(JSON.stringify({ landlord: landlord.username, addedProperties, addedRooms,
    ownedProperties: await Properties.countDocuments({ owner: landlord._id }) }));
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally { await mongoose.disconnect(); }
