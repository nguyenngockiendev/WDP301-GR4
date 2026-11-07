import express from 'express';
import jwt from 'jsonwebtoken';

import {
    createTerminationRequest,
    getMyTerminationRequests,
    checkCheckoutEligibility,
} from './terminationrequests.controller.js';

const router = express.Router();

// Middleware xác thực JWT riêng cho terminationrequests
const verifyCheckoutTenant = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Kiểm tra Authorization header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để tiếp tục',
            });
        }

        // Lấy token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ',
            });
        }

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Chuẩn hóa thông tin người dùng
        const userId = decoded.userId || decoded.id || decoded._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Token không chứa thông tin người dùng',
            });
        }

        // Kiểm tra quyền tenant
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
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Phiên đăng nhập đã hết hạn',
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn',
        });
    }
};

// Kiểm tra tenant có hợp đồng hợp lệ hay không
router.get(
    '/eligibility',
    verifyCheckoutTenant,
    checkCheckoutEligibility
);

// Tenant gửi yêu cầu checkout
router.post(
    '/',
    verifyCheckoutTenant,
    createTerminationRequest
);

// Tenant xem các yêu cầu checkout của mình
router.get(
    '/my',
    verifyCheckoutTenant,
    getMyTerminationRequests
);

export default router;