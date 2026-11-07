import * as terminationRequestsService from './terminationrequests.service.js';
import {
  sendSuccess,
  sendError,
} from '../../shared/utils/response.js';
import { canSubmitCheckoutRequest } from './terminationrequests.service.js';

export const checkCheckoutEligibility = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        const contract = await canSubmitCheckoutRequest(userId);

        return res.status(200).json({
            success: true,
            message: contract
                ? 'Bạn đủ điều kiện gửi yêu cầu checkout'
                : 'Bạn không có hợp đồng đang hiệu lực',
            data: {
                canSubmit: Boolean(contract),
                contract: contract || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const createTerminationRequest = async (req, res) => {
  try {
    const terminationRequest =
      await terminationRequestsService.createTerminationRequest(
        req.body,
        req.user.userId,
      );

    return sendSuccess(
      res,
      201,
      'Gửi yêu cầu trả phòng thành công',
      terminationRequest,
    );
  } catch (error) {
    return sendError(res, error);
  }
};

export const getMyTerminationRequests = async (req, res) => {
  try {
    const requests = await terminationRequestsService.getMyTerminationRequests(
      req.user.userId,
    );

    return sendSuccess(
      res,
      200,
      'Lấy danh sách yêu cầu trả phòng thành công!',
      requests,
    );
  } catch (error) {
    return sendError(res, error);
  }
};
