import React from 'react';
import MyCheckoutRequests from '../pages/MyCheckoutRequests';
import SubmitCheckoutRequest from '../pages/SubmitCheckoutRequest';

// Export riêng để thành viên phụ trách routing chủ động tích hợp.
// Không tự ý import file này vào AppRoutes.jsx của nhóm.
const terminationRequestsRoutes = [
  { path: '/checkout-requests', element: <MyCheckoutRequests /> },
  { path: '/checkout-requests/new', element: <SubmitCheckoutRequest /> },
];

export default terminationRequestsRoutes;
