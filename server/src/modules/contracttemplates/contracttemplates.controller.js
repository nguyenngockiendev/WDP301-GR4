import * as templatesService from './contracttemplates.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getTemplates = async (req, res) => {
  try {
    const templates = await templatesService.getTemplates(req.user, req.query);
    return sendSuccess(res, 200, 'Lấy danh sách mẫu hợp đồng thành công', templates);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPlaceholders = async (_req, res) => {
  try {
    return sendSuccess(res, 200, 'Lấy danh sách biến thành công', templatesService.getPlaceholders());
  } catch (error) {
    return sendError(res, error);
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await templatesService.getTemplateById(req.params.templateId, req.user);
    return sendSuccess(res, 200, 'Lấy mẫu hợp đồng thành công', template);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await templatesService.createTemplate(req.body, req.user);
    return sendSuccess(res, 201, 'Tạo mẫu hợp đồng thành công', template);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await templatesService.updateTemplate(req.params.templateId, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật mẫu hợp đồng thành công', template);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateTemplateStatus = async (req, res) => {
  try {
    const template = await templatesService.updateTemplateStatus(req.params.templateId, req.body.status, req.user);
    return sendSuccess(res, 200, 'Cập nhật trạng thái mẫu hợp đồng thành công', template);
  } catch (error) {
    return sendError(res, error);
  }
};
