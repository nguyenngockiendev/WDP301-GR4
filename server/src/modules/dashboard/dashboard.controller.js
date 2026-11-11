import * as dashboardService from './dashboard.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import { validateDashboardQuery } from './dashboard.validation.js';

export const getDashboard = async (req, res) => {
  try {
    const filters = validateDashboardQuery(req.query);
    const dashboard = await dashboardService.getDashboard(req.user, filters);
    return sendSuccess(res, 200, 'Lấy thông tin dashboard thành công', dashboard);
  } catch (error) {
    return sendError(res, error);
  }
};
