import * as service from './property-operations.service.js';
import { sendError, sendSuccess } from '../../shared/utils/response.js';

export const listAssets = async (req, res) => {
  try {
    const assets = await service.listAssets(req.user, req.params.propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách thiết bị thành công.', assets);
  } catch (error) {
    return sendError(res, error);
  }
};

export const listRooms = async (req, res) => {
  try {
    const rooms = await service.listRooms(req.user, req.params.propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách phòng thành công.', rooms);
  } catch (error) {
    return sendError(res, error);
  }
};

export const listCheckoutInspections = async (req, res) => {
  try {
    const inspections = await service.listCheckoutInspections(req.user, req.params.propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách kiểm kê checkout thành công.', inspections);
  } catch (error) {
    return sendError(res, error);
  }
};

export const saveCheckoutInspection = async (req, res) => {
  try {
    const inspection = await service.saveCheckoutInspection(
      req.user,
      req.params.propertyId,
      req.params.contractId,
      req.body
    );
    return sendSuccess(res, 200, 'Đã lưu kiểm kê thiết bị checkout.', inspection);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createAsset = async (req, res) => {
  try {
    const asset = await service.createAsset(req.user, req.params.propertyId, req.body);
    return sendSuccess(res, 201, 'Đã thêm thiết bị vào danh mục.', asset);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateAsset = async (req, res) => {
  try {
    const asset = await service.updateAsset(
      req.user,
      req.params.propertyId,
      req.params.assetId,
      req.body
    );
    return sendSuccess(res, 200, 'Đã cập nhật thiết bị.', asset);
  } catch (error) {
    return sendError(res, error);
  }
};

export const listMaintenance = async (req, res) => {
  try {
    const tickets = await service.listMaintenance(
      req.user,
      req.params.propertyId,
      req.query.status
    );
    return sendSuccess(res, 200, 'Lấy danh sách bảo trì thành công.', tickets);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createMaintenance = async (req, res) => {
  try {
    const ticket = await service.createMaintenance(req.user, req.params.propertyId, req.body);
    return sendSuccess(res, 201, 'Đã tạo yêu cầu bảo trì.', ticket);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    const ticket = await service.updateMaintenance(
      req.user,
      req.params.propertyId,
      req.params.ticketId,
      req.body
    );
    return sendSuccess(res, 200, 'Đã cập nhật yêu cầu bảo trì.', ticket);
  } catch (error) {
    return sendError(res, error);
  }
};
