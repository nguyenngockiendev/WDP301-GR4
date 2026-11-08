import * as propertiesService from './properties.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getMyProperties = async (req, res) => {
  try {
    const properties = await propertiesService.getMyProperties(req.user);
    return sendSuccess(res, 200, 'Lấy danh sách nhà trọ thành công', properties);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPublicProperties = async (req, res) => {
  try {
    return sendSuccess(res, 200, 'Thành công', await propertiesService.getPublicProperties());
  } catch (error) { return sendError(res, error); }
};
