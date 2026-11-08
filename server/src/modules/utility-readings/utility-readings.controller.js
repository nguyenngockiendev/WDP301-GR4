import { sendError, sendSuccess } from '../../shared/utils/response.js';
import * as utilityReadingsService from './utility-readings.service.js';

export const getUtilityReadings = async (req, res) => {
  try {
    const data = {
      propertyId: req.query.propertyId,
      billingMonth: req.query.billingMonth,
    };
    const result = await utilityReadingsService.getUtilityReadings(data, req.user);
    return sendSuccess(res, 200, 'Lấy chỉ số điện nước thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const saveUtilityReadings = async (req, res) => {
  try {
    const data = {
      propertyId: req.body?.propertyId,
      billingMonth: req.body?.billingMonth,
      readings: req.body?.readings,
    };
    const result = await utilityReadingsService.saveUtilityReadings(data, req.user);
    return sendSuccess(res, result.createdCount ? 201 : 200, 'Đã lưu chỉ số điện nước!', result.readings);
  } catch (error) {
    return sendError(res, error);
  }
};
