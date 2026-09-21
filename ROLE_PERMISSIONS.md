# Phân quyền hệ thống quản lý trọ

| Mã vai trò | Tên hiển thị    | Quyền hiện có                                                                  |
| ---------- | --------------- | ------------------------------------------------------------------------------ |
| ADMIN      | Chủ trọ         | Quản lý tài khoản, tạo phòng, xem tất cả phòng, phân công/đổi/gỡ quản lý phòng |
| MANAGER    | Quản lý dãy trọ | Xem danh sách và chi tiết phòng được phân công, cập nhật hồ sơ cá nhân         |
| TENANT     | Người thuê      | Đăng ký, đăng nhập, cập nhật hồ sơ cá nhân                                     |

Cổng thanh toán là hệ thống bên ngoài, không phải vai trò tài khoản. Không còn module Course hoặc vai trò Expert.

## Phạm vi kiểm soát

- Tự đăng ký luôn tạo TENANT; hồ sơ không cho tự thay đổi role/email.
- Chỉ Chủ trọ tạo phòng và phân công tài khoản MANAGER.
- Quyền xem phòng của Manager dựa vào Room.manager, không dựa vào người tạo phòng.
- Sau khi gỡ phân công, Manager mất quyền truy cập ở request tiếp theo.
- Phòng cũ chưa có manager được xem là chưa phân công. Chủ trọ phân công tại trang chi tiết.
- Role cũ không hợp lệ bị chặn đăng nhập và không tiếp tục sử dụng session cũ.

## Nghiệp vụ trong ảnh chưa triển khai

- Tạo dãy và phân công quản lý theo dãy (hiện phân công từng phòng).
- Manager thêm hồ sơ khách thuê, lập hợp đồng, gửi Chủ trọ duyệt.
- Hợp đồng có hiệu lực làm phòng chuyển sang đang thuê.
- Manager nhập điện nước, lập hóa đơn, ghi nhận thanh toán và theo dõi công nợ.
- Người thuê xem phòng/hợp đồng/hóa đơn của mình, thanh toán, gửi yêu cầu gia hạn hoặc trả phòng.
- Gia hạn, thanh lý hợp đồng, quyết toán tiền cọc, kiểm tra phòng và chuyển trạng thái trống/bảo trì.
- Tích hợp cổng thanh toán bên ngoài và xác thực kết quả giao dịch.

Các mục trên là phạm vi nghiệp vụ mục tiêu, chưa phải chức năng đã hoạt động. Bản hiện tại đáp ứng phần tài khoản và phân quyền phòng cơ bản; chưa phải toàn bộ hệ thống trong ảnh.
