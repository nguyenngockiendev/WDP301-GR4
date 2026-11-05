# UC43 — JWT và WebSocket

Đăng nhập lại sau khi chuyển từ session. Đăng nhập email/Google lưu JWT từ data.user;
Axios gửi Authorization: Bearer <token>. Không sử dụng cookie session cho API thông báo.
Middleware kiểm tra chữ ký HS256, thời hạn và userId. GET /api/auth/me trả claims đã xác minh.

WebSocket /ws/notifications dùng cùng cổng backend. Trong 5 giây sau khi kết nối,
client gửi { type: 'authenticate', token }. JWT không đặt trong URL.
Server kiểm tra Origin và JWT, tự chọn người nhận từ userId; không cho client chọn tài khoản khác.
Socket đóng khi token hết hạn. Frontend xóa token hết hạn và yêu cầu đăng nhập lại.
Mất kết nối mạng sẽ tự thử lại sau 1–30 giây; sự kiện ready tải lại dữ liệu bỏ lỡ.

createNotification() lưu DB rồi phát notifications.changed tới tất cả tab của người nhận.
Đánh dấu đã đọc cũng phát sự kiện. Frontend tải lại số chưa đọc và danh sách theo bộ lọc/trang hiện tại.
Ghi trực tiếp bằng Compass/import không phát sự kiện; các module phải gọi service.
Triển khai nhiều tiến trình cần pub/sub dùng chung.

Đăng xuất xóa token và đóng socket ở client, đồng bộ các tab cùng origin qua storage event.
Chưa có blacklist/refresh token: bản sao token vẫn hợp lệ đến hạn (hiện 1 giờ).

API:
- GET /api/notifications?page=1&limit=10&status=all (all/read/unread; limit 1–100)
- GET /api/notifications/unread-count
- PATCH /api/notifications/:id/read
- PATCH /api/notifications/read-all

Chạy npm test trong server; test dùng MongoDB tạm, không ghi Atlas.
Frontend: npm run dev trong client; backend: npm run dev trong server.
