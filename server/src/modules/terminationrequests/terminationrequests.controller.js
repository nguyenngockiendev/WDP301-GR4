import * as terminationRequestsService from './terminationrequests.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

// Kiểm tra điều kiện gửi checkout request của Tenant
export const checkCheckoutEligibility = async (req, res, next) => {
    try {
        const contract = await terminationRequestsService.canSubmitCheckoutRequest(
            req.user.userId,
            req.query.contractId
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

// Manager lấy dữ liệu kiểm tra tài sản của checkout request.
export const getCheckoutAssetInspection = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.getCheckoutAssetInspection(managerId, req.params.id);
        return sendSuccess(res, 200, 'Lấy danh sách tài sản kiểm tra thành công', result);
    } catch (error) {
        return sendError(res, error);
    }
};

// Manager bắt đầu kiểm tra và tạo invoice tài sản (nếu chưa có).
export const startCheckoutAssetInspection = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.startCheckoutAssetInspection(managerId, req.params.id);
        return sendSuccess(res, 201, 'Đã bắt đầu kiểm tra tài sản', result);
    } catch (error) {
        return sendError(res, error);
    }
};

// Manager lưu trạng thái tài sản, ảnh Base64 và tổng tiền invoice.
export const saveCheckoutAssetInspection = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.saveCheckoutAssetInspection(managerId, req.params.id, req.body);
        return sendSuccess(res, 200, 'Lưu kết quả kiểm tra tài sản thành công', result);
    } catch (error) {
        return sendError(res, error);
    }
};


// Manager lấy dữ liệu đối soát công nợ, điện nước và tiền cọc.
export const getCheckoutReconciliation = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.getCheckoutReconciliation(managerId, req.params.id);
        return sendSuccess(res, 200, 'Lấy dữ liệu đối soát checkout thành công', result);
    } catch (error) {
        return sendError(res, error);
    }
};

// Manager lưu chỉ số điện nước cuối và kết quả quyết toán tiền cọc.
export const saveCheckoutReconciliation = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.saveCheckoutReconciliation(managerId, req.params.id, req.body);
        return sendSuccess(res, 200, 'Lưu đối soát checkout thành công', result);
    } catch (error) {
        return sendError(res, error);
    }
};


// Manager gửi yêu cầu thanh toán phần công nợ checkout còn thiếu cho Tenant.
export const requestCheckoutPayment = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.requestCheckoutPayment(managerId, req.params.id);
        return sendSuccess(res, 200, 'Đã gửi yêu cầu thanh toán checkout cho Tenant', result);
    } catch (error) {
        return sendError(res, error);
    }
};

// Manager xác nhận đã hoàn tiền cọc ngoài hệ thống.
export const confirmCheckoutRefund = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.confirmCheckoutRefund(managerId, req.params.id);
        return sendSuccess(res, 200, 'Đã xác nhận hoàn tiền cọc', result);
    } catch (error) {
        return sendError(res, error);
    }
};

// Manager chủ động xác nhận cuối cùng để terminate hợp đồng và mở lại phòng.
export const finalizeCheckout = async (req, res) => {
    try {
        const managerId = getManagerId(req);
        if (!managerId) return res.status(401).json({ success: false, message: 'Không xác định được tài khoản Manager' });
        const result = await terminationRequestsService.finalizeCheckout(managerId, req.params.id);
        return sendSuccess(res, 200, 'Đã xác nhận hoàn tất checkout, hợp đồng đã kết thúc và phòng đã được mở', result);
    } catch (error) {
        return sendError(res, error);
    }
};
