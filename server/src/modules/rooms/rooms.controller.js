import * as roomsService from './rooms.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getRoomsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const rooms = await roomsService.getRoomsByProperty(propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách phòng thành công', rooms);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await roomsService.getRoomById(roomId);
    return sendSuccess(res, 200, 'Lấy thông tin phòng thành công', room);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createRoom = async (req, res) => {
  try {
    const newRoom = await roomsService.createRoom(req.body);
    return sendSuccess(res, 201, 'Tạo phòng thành công', newRoom);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updatedRoom = await roomsService.updateRoom(roomId, req.body);
    return sendSuccess(res, 200, 'Cập nhật phòng thành công', updatedRoom);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const updatedRoom = await roomsService.updateRoomStatus(roomId, req.body.status);
    return sendSuccess(res, 200, 'Cập nhật trạng thái phòng thành công', updatedRoom);
  } catch (error) {
    return sendError(res, error);
  }
};

export const deactivateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const deactivatedRoom = await roomsService.deactivateRoom(roomId);
    return sendSuccess(res, 200, 'Vô hiệu hóa phòng thành công', deactivatedRoom);
  } catch (error) {
    return sendError(res, error);
  }
};

export const searchAvailableRooms = async (req, res) => {
  try {
    const filters = req.query;
    const rooms = await roomsService.searchAvailableRooms(filters);
    return sendSuccess(res, 200, 'Tìm kiếm phòng thành công', rooms);
  } catch (error) {
    return sendError(res, error);
  }
};
