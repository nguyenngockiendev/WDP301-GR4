# UC43 — Thông báo

Frontend: `/notifications`, dùng DashboardLayout và màu Tailwind của nhóm.
Đăng nhập lại nếu trình duyệt còn token cũ (frontend trước đây lưu cả object phản hồi).

Các API yêu cầu `Authorization: Bearer <JWT>`:

| Method | URL | Chức năng |
| --- | --- | --- |
| GET | `/api/notifications?page=1&limit=10&status=all` | Danh sách mới nhất trước; status: all/read/unread; limit: 1–100 |
| GET | `/api/notifications/unread-count` | Số chưa đọc |
| PATCH | `/api/notifications/:id/read` | Đánh dấu đã đọc |
| PATCH | `/api/notifications/read-all` | Đánh dấu tất cả đã đọc |

Người nhận luôn lấy từ JWT, không lấy từ query/body. Thông báo của người khác trả 404 khi cập nhật.
Phản hồi dùng cấu trúc chung `{ success, message, data }`.
Danh sách trả `items`, `total`, `unreadCount`, `page`, `limit`, `totalPages`.

Module khác có thể import `createNotification` từ `notifications.service.js`
và truyền `{ recipient, title, content, type, related }` sau khi nghiệp vụ thành công.
Chưa tự động phát sinh thông báo từ hóa đơn/hợp đồng; chưa điều hướng tới đối tượng liên quan.
Tài khoản chưa có thông báo sẽ thấy trạng thái trống.

Kiểm thử tại thư mục server: `node --test test/notifications.test.js`.
Test dùng MongoDB tạm trên máy (mongodb-memory-server tự tải MongoDB lần đầu),
không kết nối hoặc ghi dữ liệu lên Atlas. Có sẵn dữ liệu hai người dùng giả trong test
để kiểm tra phân trang, bộ lọc, JWT và chống đọc/cập nhật chéo tài khoản.

Chạy backend bằng `npm run dev` trong server, frontend bằng `npm run dev` trong client.
Frontend mặc định ở cổng 3000, backend theo PORT trong server/.env.
