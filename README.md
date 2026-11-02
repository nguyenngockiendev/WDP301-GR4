# Haven Stay — Quản lý nhà trọ

Dự án dùng React + Vite cho giao diện, Node.js + Express cho API và MongoDB/Mongoose để lưu dữ liệu. Mã nguồn được chia theo feature để dễ tìm và mở rộng.

```text
client/src/
  app/          Routes của ứng dụng
  features/     Màn hình theo nghiệp vụ
  shared/       Components, context, API và styles dùng chung

server/src/
  app/          Khởi tạo ứng dụng và ghép API routes
  config/       Database và cấu hình
  models/       Các Mongoose model dùng chung
  modules/      Controller, service, DAO, DTO và routes theo nghiệp vụ
  shared/       Middleware, constants và tiện ích dùng chung
```

## Chạy local

Cần Node.js 22 trở lên và MongoDB local hoặc Atlas.

```powershell
npm ci --prefix server
npm ci --prefix client
Copy-Item server/.env.example server/.env
```

Điền `MONGODB_URI` và `SESSION_SECRET` (ít nhất 32 ký tự) trong `server/.env`. Không commit file `.env` hoặc thông tin kết nối database.

Mở hai terminal tại thư mục dự án:

```powershell
npm --prefix server run dev
npm --prefix client run dev
```

Frontend chạy tại http://localhost:3000; API chạy tại http://localhost:4000/api. Vite chuyển tiếp các request `/api` đến backend.

## Nghiệp vụ hiện có

- Đăng ký, đăng nhập, đăng xuất, hồ sơ và phân quyền LANDLORD, MANAGER, TENANT.
- Quản lý dãy trọ, gán quản lý, thay đổi trạng thái dãy và tạo một hoặc nhiều phòng.
- Theo dõi lịch sử giá phòng và ngày hiệu lực; hợp đồng lưu lại mức thuê và phí tại thời điểm tạo.
- Ghi chỉ số điện nước, lập hóa đơn với từng dòng tiền thuê, điện, nước và dịch vụ.
- Cài đặt giá điện, nước, phí dịch vụ; dashboard, báo cáo và danh sách nghiệp vụ theo quyền.

Các màn hình React nằm trong `client/src/features/`; API của mỗi nghiệp vụ nằm trong thư mục tương ứng dưới `server/src/modules/`.
