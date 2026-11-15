import mongoose from 'mongoose';
import Rooms from '../../models/Rooms.js';
import UtilityReadings from '../../models/UtilityReadings.js';
import { assertPropertyAccess } from '../properties/properties.service.js';

function validatePeriod(propertyId, billingMonth) {
  if (typeof propertyId !== 'string' || !mongoose.isObjectIdOrHexString(propertyId)) {
    throw { status: 400, message: 'Mã nhà trọ không hợp lệ!' };
  }
  if (typeof billingMonth !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(billingMonth)) {
    throw { status: 400, message: 'Kỳ ghi chỉ số phải có định dạng YYYY-MM!' };
  }
}

const validReading = value => Number.isFinite(value) && value >= 0;

async function getLatestReadings(roomIds, beforeMonth, session) {
  const filter = { room: { $in: roomIds } };
  if (beforeMonth) filter.billingMonth = { $lt: beforeMonth };

  const query = UtilityReadings.find(filter)
    .select('room billingMonth newElectricity newWater')
    .sort({ room: -1, billingMonth: -1 })
    .lean();
  if (session) query.session(session);
  const readings = await query;
  const latestByRoom = new Map();

  for (const reading of readings) {
    const roomId = String(reading.room);
    if (!latestByRoom.has(roomId)) {
      latestByRoom.set(roomId, reading);
    }
  }

  return latestByRoom;
}

export const getUtilityReadings = async (data, user) => {
  const { propertyId, billingMonth } = data;
  validatePeriod(propertyId, billingMonth);
  await assertPropertyAccess(user, propertyId);

  const roomIds = await Rooms.distinct('_id', { property: propertyId, status: 'occupied' });
  if (!roomIds.length) return [];

  const [currentReadings, previousReadings, laterRooms] = await Promise.all([
    UtilityReadings.find({ room: { $in: roomIds }, billingMonth }).lean(),
    getLatestReadings(roomIds, billingMonth),
    UtilityReadings.distinct('room', {
      room: { $in: roomIds },
      billingMonth: { $gt: billingMonth },
    }),
  ]);
  const currentByRoom = new Map(currentReadings.map(reading => [String(reading.room), reading]));
  const roomsWithLaterReading = new Set(laterRooms.map(String));

  return roomIds.map(room => {
    const roomId = String(room);
    const current = currentByRoom.get(roomId);
    if (current) return { ...current, isRecorded: true };

    const previous = previousReadings.get(roomId);
    return {
      room,
      billingMonth,
      oldElectricity: previous?.newElectricity ?? null,
      oldWater: previous?.newWater ?? null,
      newElectricity: null,
      newWater: null,
      previousBillingMonth: previous?.billingMonth ?? null,
      isRecorded: false,
      isLocked: roomsWithLaterReading.has(roomId),
    };
  });
};

export const saveUtilityReadings = async (data, user) => {
  const { propertyId, billingMonth, readings } = data;
  validatePeriod(propertyId, billingMonth);
  await assertPropertyAccess(user, propertyId);

  const currentMonth = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' })
    .slice(0, 7);
  if (billingMonth !== currentMonth) {
    throw { status: 400, message: 'Chỉ được ghi chỉ số cho kỳ hiện tại. Vui lòng tải lại trang!' };
  }

  if (!Array.isArray(readings) || !readings.length) {
    throw { status: 400, message: 'Vui lòng nhập chỉ số cho ít nhất một phòng!' };
  }

  const roomIds = new Set();
  for (const reading of readings) {
    if (typeof reading?.room !== 'string' || !mongoose.isObjectIdOrHexString(reading.room)) {
      throw { status: 400, message: 'Mã phòng không hợp lệ!' };
    }
    const roomId = reading.room.toLowerCase();
    if (roomIds.has(roomId)) {
      throw { status: 400, message: 'Một phòng chỉ được gửi một lần trong danh sách!' };
    }
    roomIds.add(roomId);
    if (!validReading(reading.newElectricity) || !validReading(reading.newWater)) {
      throw { status: 400, message: 'Số điện mới và số nước mới phải là số không âm!' };
    }
  }

  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const rooms = await Rooms.find({ _id: { $in: [...roomIds] }, property: propertyId })
        .select('roomNumber status')
        .session(session)
        .lean();
      if (rooms.length !== roomIds.size) {
        throw { status: 403, message: 'Có phòng không thuộc nhà trọ đang quản lý!' };
      }
      const unoccupiedRoom = rooms.find(room => room.status !== 'occupied');
      if (unoccupiedRoom) {
        throw {
          status: 409,
          message: `Phòng ${unoccupiedRoom.roomNumber} hiện không có người thuê. Vui lòng tải lại danh sách!`,
        };
      }
      const roomById = new Map(rooms.map(room => [String(room._id), room]));
      const ids = rooms.map(room => room._id);
      const currentReadings = await UtilityReadings.find({ room: { $in: ids }, billingMonth })
        .session(session)
        .lean();
      const currentByRoom = new Map(
        currentReadings.map(reading => [String(reading.room), reading]),
      );
      const latestByRoom = await getLatestReadings(ids, null, session);
      const newReadings = [];

      for (const reading of readings) {
        const roomId = reading.room.toLowerCase();
        const { newElectricity, newWater } = reading;
        const room = roomById.get(roomId);
        const current = currentByRoom.get(roomId);
        if (current) {
          const sameElectricity =
            current.newElectricity === newElectricity &&
            (reading.oldElectricity === undefined ||
              current.oldElectricity === reading.oldElectricity);
          const sameWater =
            current.newWater === newWater &&
            (reading.oldWater === undefined || current.oldWater === reading.oldWater);
          if (sameElectricity && sameWater) continue;
          throw { status: 409, message: `Phòng ${room.roomNumber} đã ghi chỉ số trong kỳ này!` };
        }

        const latest = latestByRoom.get(roomId);
        if (latest?.billingMonth > billingMonth) {
          throw {
            status: 409,
            message: `Phòng ${room.roomNumber} đã ghi kỳ sau, không thể chèn chỉ số vào kỳ này!`,
          };
        }

        const oldElectricity = latest ? latest.newElectricity : reading.oldElectricity;
        const oldWater = latest ? latest.newWater : reading.oldWater;
        if (!validReading(oldElectricity) || !validReading(oldWater)) {
          throw {
            status: 400,
            message: `Vui lòng nhập chỉ số điện và nước bàn giao của phòng ${room.roomNumber}!`,
          };
        }
        if (newElectricity < oldElectricity || newWater < oldWater) {
          throw {
            status: 400,
            message: `Số mới của phòng ${room.roomNumber} phải lớn hơn hoặc bằng số cũ!`,
          };
        }

        newReadings.push({
          room: room._id,
          billingMonth,
          oldElectricity,
          newElectricity,
          electricityReading: newElectricity - oldElectricity,
          oldWater,
          newWater,
          waterReading: newWater - oldWater,
          recordedBy: user.userId,
        });
      }

      if (newReadings.length) {
        await Rooms.updateMany(
          { _id: { $in: newReadings.map(reading => reading.room) }, property: propertyId },
          { $inc: { __v: 1 } },
          { session, timestamps: false },
        );
        const saved = await UtilityReadings.insertMany(newReadings, { session });
        for (const reading of saved) {
          currentByRoom.set(String(reading.room), reading.toObject());
        }
      }

      return {
        createdCount: newReadings.length,
        readings: readings.map(item => ({
          ...currentByRoom.get(item.room.toLowerCase()),
          isRecorded: true,
        })),
      };
    });
  } catch (error) {
    if (error.code === 11000) {
      throw {
        status: 409,
        message: 'Chỉ số của phòng trong kỳ này đã được lưu. Vui lòng tải lại dữ liệu!',
      };
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
