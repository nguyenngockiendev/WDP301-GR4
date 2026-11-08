import * as assignmentsService from './managerassignments.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getAssignments = async (req, res) => {
  try {
    const assignments = await assignmentsService.getAssignments(req.user, req.query);
    return sendSuccess(res, 200, 'Lấy danh sách quản lý được giao thành công', assignments);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getAvailableManagers = async (req, res) => {
  try {
    const managers = await assignmentsService.getAvailableManagers(req.query);
    return sendSuccess(res, 200, 'Lấy danh sách tài khoản quản lý thành công', managers);
  } catch (error) {
    return sendError(res, error);
  }
};

export const assignManager = async (req, res) => {
  try {
    const assignment = await assignmentsService.assignManager(req.body, req.user);
    return sendSuccess(res, 201, 'Giao quản lý nhà trọ thành công', assignment);
  } catch (error) {
    return sendError(res, error);
  }
};

export const removeAssignment = async (req, res) => {
  try {
    const assignment = await assignmentsService.removeAssignment(req.params.assignmentId, req.user);
    return sendSuccess(res, 200, 'Đã gỡ quản lý khỏi nhà trọ', assignment);
  } catch (error) {
    return sendError(res, error);
  }
};
