import * as terminationRequestsService from './terminationrequests.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

// Kiểm tra điều kiện gửi checkout request của Tenant
export const checkCheckoutEligibility = async (req, res, next) => {
    try {
        const contract = await terminationRequestsService.canSubmitCheckoutRequest(
            req.user.userId
        );

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

// Tenant tạo checkout request
export const createTerminationRequest = async (req, res) => {
    try {
        const result = await terminationRequestsService.createTerminationRequest(
            req.body,
            req.user.userId
        );

        return sendSuccess(
            res,
            201,
            'Gửi yêu cầu trả phòng thành công',
            result
        );
    } catch (error) {
        return sendError(res, error);
    }
};

// Tenant xem checkout request của mình
export const getMyTerminationRequests = async (req, res) => {
    try {
        const result = await terminationRequestsService.getMyTerminationRequests(
            req.user.userId
        );

        return sendSuccess(
            res,
            200,
            'Lấy danh sách yêu cầu trả phòng thành công',
            result
        );
    } catch (error) {
        return sendError(res, error);
    }
};

// Lấy ID Manager từ thông tin JWT
const getManagerId = (req) => {
    return req.user?.userId || req.user?.id || req.user?._id;
};

// Manager xem danh sách checkout request thuộc Property được giao
export const getManagerTerminationRequests = async (req, res) => {
    try {
        const managerId = getManagerId(req);

        if (!managerId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được tài khoản Manager',
            });
        }

        const result =
            await terminationRequestsService.getManagerTerminationRequests(
                managerId,
                req.query
            );

        return sendSuccess(
            res,
            200,
            'Lấy danh sách checkout request thành công',
            result
        );
    } catch (error) {
        return sendError(res, error);
    }
};

// Manager xem chi tiết một checkout request
export const getManagerTerminationRequestDetail = async (req, res) => {
    try {
        const managerId = getManagerId(req);

        if (!managerId) {
            return res.status(401).json({
                success: false,
                message: 'Không xác định được tài khoản Manager',
            });
        }

        const result =
            await terminationRequestsService.getManagerTerminationRequestDetail(
                managerId,
                req.params.id
            );

        return sendSuccess(
            res,
            200,
            'Lấy chi tiết checkout request thành công',
            result
        );
    } catch (error) {
        return sendError(res, error);
    }
};