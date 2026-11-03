import * as service from './landlord.service.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';

const handle = (fn, status = 200, message = 'Thành công.') => async (req, res) => {
  try {
    const data = await fn(req);
    return sendSuccess(res, status, message, data);
  } catch (error) { return sendError(res, error); }
};

export const listProperties = handle(req => service.listProperties(req.user.userId));
export const createProperty = handle(req => service.createProperty(req.user.userId, req.body), 201, 'Đã tạo nhà trọ.');
export const updateProperty = handle(req => service.updateProperty(req.user.userId, req.params.propertyId, req.body), 200, 'Đã cập nhật nhà trọ.');
export const setPropertyStatus = handle(req => service.setPropertyStatus(req.user.userId, req.params.propertyId, req.body.status));
export const listManagers = handle(req => service.listManagers(req.user.userId));
export const listUsers = handle(() => service.listUsers());
export const promoteUserToManager = handle(req => service.promoteUserToManager(req.user.userId, req.params.userId), 200, 'Đã nâng tài khoản thành Quản lý viên.');
export const createManager = handle(req => service.createManager(req.user.userId, req.body), 201, 'Đã tạo tài khoản quản lý.');
export const setManagerStatus = handle(req => service.setManagerStatus(req.user.userId, req.params.managerId, req.body.status));
export const listAssignments = handle(req => service.listAssignments(req.user.userId));
export const assignManager = handle(req => service.assignManager(req.user.userId, req.body.managerId, req.body.propertyIds), 200, 'Đã cập nhật phân công.');
export const removeAssignment = handle(req => service.removeAssignment(req.user.userId, req.params.assignmentId));
export const configureRates = handle(req => service.configureRates(req.user.userId, req.params.propertyId, req.body));
export const configurePolicy = handle(req => service.configurePolicy(req.user.userId, req.params.propertyId, req.body));
export const listServices = handle(req => service.listServices(req.user.userId, req.params.propertyId));
export const createService = handle(req => service.saveService(req.user.userId, req.params.propertyId, null, req.body), 201, 'Đã tạo dịch vụ.');
export const updateService = handle(req => service.saveService(req.user.userId, req.params.propertyId, req.params.serviceId, req.body));
export const setServiceStatus = handle(req => service.setServiceStatus(req.user.userId, req.params.propertyId, req.params.serviceId, req.body.status));
export const listPropertyRooms = handle(req => service.listPropertyRooms(req.user.userId, req.params.propertyId));
export const setRoomPrice = handle(req => service.setRoomPrice(req.user.userId, req.params.propertyId, req.params.roomId, req.body.price));
