import * as rentalRequestsService from './rentalrequests.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getRentalRequestsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const requests = await rentalRequestsService.getRentalRequestsByProperty(propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách yêu cầu thuê thành công', requests);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getRentalRequestById = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await rentalRequestsService.getRentalRequestById(requestId);
    return sendSuccess(res, 200, 'Lấy thông tin yêu cầu thuê thành công', request);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createRentalRequest = async (req, res) => {
  try {
    const newRequest = await rentalRequestsService.createRentalRequest(req.body);
    return sendSuccess(res, 201, 'Tạo yêu cầu thuê thành công', newRequest);
  } catch (error) {
    return sendError(res, error);
  }
};

export const processRentalRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.session.user.userId;
    const processedRequest = await rentalRequestsService.processRentalRequest(
      requestId,
      req.body,
      userId,
    );
    return sendSuccess(res, 200, 'Xử lý yêu cầu thuê thành công', processedRequest);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const requests = await rentalRequestsService.getPendingRequests(propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách yêu cầu chờ xử lý thành công', requests);
  } catch (error) {
    return sendError(res, error);
  }
};
