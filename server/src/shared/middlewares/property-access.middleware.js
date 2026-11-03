import mongoose from 'mongoose';
import Properties from '../../models/Properties.js';
import Rooms from '../../models/Rooms.js';
import ManagerAssignments from '../../models/ManagerAssignments.js';
import { sendError } from '../utils/response.js';

export async function requirePropertyManager(req, res, next) {
  try {
    let propertyId = req.params.propertyId || req.body?.property;
    if (!propertyId && req.params.roomId && mongoose.Types.ObjectId.isValid(req.params.roomId)) {
      const room = await Rooms.findById(req.params.roomId).select('property');
      propertyId = room?.property;
    }
    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return sendError(res, { status: 400, message: 'Nhà trọ không hợp lệ.' });
    }
    const property = req.user.role === 'landlord'
      ? await Properties.findOne({ _id: propertyId, owner: req.user.userId }).select('_id')
      : await ManagerAssignments.exists({ manager: req.user.userId, property: propertyId, status: 'active' });
    if (!property) return sendError(res, { status: 403, message: 'Bạn không được quản lý nhà trọ này.' });
    req.propertyId = propertyId;
    next();
  } catch (error) { next(error); }
}
