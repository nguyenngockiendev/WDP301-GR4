import express from 'express';
import jwt from 'jsonwebtoken';

import {
    authMiddleware,
    checkRole,
} from '../../shared/middlewares/middlewave.js';

import {
    checkCheckoutEligibility,
    createTerminationRequest,
    getMyTerminationRequests,
    getManagerTerminationRequests,
    getManagerTerminationRequestDetail,
    getCheckoutAssetInspection,
    startCheckoutAssetInspection,
    saveCheckoutAssetInspection,
    getCheckoutReconciliation,
    saveCheckoutReconciliation,
    requestCheckoutPayment,
    confirmCheckoutRefund,
    finalizeCheckout,
} from './terminationrequests.controller.js';

const router = express.Router();

// Middleware xác thực Tenant hiện tại
const verifyCheckoutTenant = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục',
            });
        }

        const decoded = jwt.verify(
            authHeader.split(' ')[1],
            process.env.JWT_SECRET
        );

        const userId = decoded.userId || decoded.id || decoded._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token không chứa thông tin người dùng',
            });
        }

        if (decoded.role !== 'tenant') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền thực hiện chức năng này',
            });
        }

        req.user = {
            ...decoded,
            userId,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                error.name === 'TokenExpiredError'
                    ? 'Phiên đăng nhập đã hết hạn'
                    : 'Token không hợp lệ hoặc đã hết hạn',
        });
    }
};

// ================= MANAGER =================

// Xem danh sách checkout request
router.get(
    '/manager',
    authMiddleware,
    checkRole('manager'),
    getManagerTerminationRequests
);

// Kiểm tra tài sản trong checkout request
router.get('/manager/:id/asset-inspection', authMiddleware, checkRole('manager'), getCheckoutAssetInspection);
router.post('/manager/:id/asset-inspection/start', authMiddleware, checkRole('manager'), startCheckoutAssetInspection);
router.put('/manager/:id/asset-inspection', authMiddleware, checkRole('manager'), saveCheckoutAssetInspection);

// Đối soát công nợ, điện nước, phạt hợp đồng và tiền cọc
router.get('/manager/:id/reconciliation', authMiddleware, checkRole('manager'), getCheckoutReconciliation);
router.put('/manager/:id/reconciliation', authMiddleware, checkRole('manager'), saveCheckoutReconciliation);

// Các bước thanh toán/hoàn cọc và xác nhận checkout cuối cùng.
router.post('/manager/:id/request-payment', authMiddleware, checkRole('manager'), requestCheckoutPayment);
router.post('/manager/:id/confirm-refund', authMiddleware, checkRole('manager'), confirmCheckoutRefund);
router.post('/manager/:id/finalize', authMiddleware, checkRole('manager'), finalizeCheckout);

// Xem chi tiết checkout request
router.get(
    '/manager/:id',
    authMiddleware,
    checkRole('manager'),
    getManagerTerminationRequestDetail
);

// ================= TENANT =================

// Kiểm tra điều kiện gửi checkout request
router.get(
    '/eligibility',
    verifyCheckoutTenant,
    checkCheckoutEligibility
);

// Gửi checkout request
router.post(
    '/',
    verifyCheckoutTenant,
    createTerminationRequest
);

// Xem checkout request của Tenant
router.get(
    '/my',
    verifyCheckoutTenant,
    getMyTerminationRequests
);

export default router;