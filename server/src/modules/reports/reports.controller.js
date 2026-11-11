import * as reportsService from './reports.service.js';
import { validateReportQuery } from './reports.validation.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = validateReportQuery(req.query);
    const reports = await reportsService.getReports(userId, filters);
    return sendSuccess(res, 200, 'Lấy báo cáo thành công', reports);
  } catch (error) {
    return sendError(res, error);
  }
};
