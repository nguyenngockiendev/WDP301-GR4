import * as reconciliationService from './reconciliation.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const syncPayment = async (req, res) => {
  try {
    const result = await reconciliationService.syncPayment(req.params.paymentId, req.user.userId);
    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getReconciliation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const reconciliation = await reconciliationService.getReconciliation(userId, req.query);
    return sendSuccess(res, 200, 'Lấy đối soát nội bộ thành công', reconciliation);
  } catch (error) {
    return sendError(res, error);
  }
};
