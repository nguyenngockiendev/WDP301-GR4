import * as service from './property-operations.service.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';

const handle = (fn, status = 200, message = 'Thành công.') => async (req, res) => {
  try { return sendSuccess(res, status, message, await fn(req)); }
  catch (error) { return sendError(res, error); }
};

export const listAssets = handle(req => service.listAssets(req.user, req.params.propertyId));
export const listRooms = handle(req => service.listRooms(req.user, req.params.propertyId));
export const createAsset = handle(req => service.createAsset(req.user, req.params.propertyId, req.body), 201, 'Đã thêm thiết bị vào danh mục.');
export const updateAsset = handle(req => service.updateAsset(req.user, req.params.propertyId, req.params.assetId, req.body));
export const listMaintenance = handle(req => service.listMaintenance(req.user, req.params.propertyId, req.query.status));
export const createMaintenance = handle(req => service.createMaintenance(req.user, req.params.propertyId, req.body), 201, 'Đã tạo yêu cầu bảo trì.');
export const updateMaintenance = handle(req => service.updateMaintenance(req.user, req.params.propertyId, req.params.ticketId, req.body));
