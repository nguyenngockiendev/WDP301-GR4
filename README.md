# 🏢 HỆ THỐNG QUẢN LÝ NHÀ TRỌ & CĂN HỘ (HAVEN STAY) — WDP301_GR4

> **Tài liệu hướng dẫn quy chuẩn kiến trúc dự án dành cho tất cả thành viên trong nhóm.**  
> Vui lòng đọc kỹ tài liệu này trước khi bắt đầu tạo module/tính năng mới để tránh xung đột mã nguồn (Git Conflict) và giữ code đồng bộ 100%.

---

## 📌 1. TỔNG QUAN KIẾN TRÚC (FULLSTACK MODULAR ARCHITECTURE)

Dự án được phân tách độc lập 2 phần **`client/` (Frontend)** và **`server/` (Backend)** theo mô hình **Feature/Module-based**:

```text
WDP301-GR4/
├── client/                     # Mã nguồn Frontend (React + Vite + Tailwind CSS)
│   └── src/
│       ├── app/                # Gom Routes tổng của toàn bộ ứng dụng
│       ├── assets/             # Hình ảnh, fonts, styles toàn cục
│       ├── features/           # ★ NƠI MỖI THÀNH VIÊN TẠO MODULE CỦA MÌNH (Mẫu: auth/)
│       ├── layouts/            # Các khung giao diện chung (DashboardLayout...)
│       └── shared/             # Dùng chung toàn Client (axiosClient, hooks, components...)
│
├── server/                     # Mã nguồn Backend (Node.js + Express + MongoDB Mongoose)
│   └── src/
│       ├── app/                # app.js & routes.js (Trạm phân luồng API tổng /api)
│       ├── config/             # Cấu hình Database & biến môi trường
│       ├── models/             # ★ TẤT CẢ CÁC BẢNG DATABASE DÙNG CHUNG (Users, Rooms...)
│       ├── modules/            # ★ NƠI MỖI THÀNH VIÊN TẠO MODULE CỦA MÌNH (Mẫu: auth/)
│       └── shared/             # Dùng chung toàn Server (middlewares, utils response.js...)
│
├── .gitignore                  # Chặn node_modules và .env đẩy lên Git
├── .prettierrc.json            # Quy tắc format code chung cho cả nhóm
└── README.md                   # Hướng dẫn này
```

---

## ☁️ 2. HƯỚNG DẪN KẾT NỐI & XEM DATABASE CLOUD (MONGODB ATLAS)

Dự án dùng chung **1 Database đám mây duy nhất trên MongoDB Atlas** theo thời gian thực (ai thêm/sửa/xoá dữ liệu thì tất cả thành viên khác đều nhìn thấy ngay lập tức).

### Bước 1: Cấu hình kết nối trên máy cá nhân
Tạo file `server/.env` và dán chuỗi kết nối của nhóm:
```env
PORT=4000
MONGODB_URI=mongodb+srv://kien34217_db_user:omSZsdQsiF1hgbXK@nexoracluster.ijcoacr.mongodb.net/WDP301_GR4?retryWrites=true&w=majority
JWT_SECRET=wdp301_gr4_jwt_secret_key_2026
```

### Bước 2: Tải công cụ xem và quản lý Database trực quan (MongoDB Compass)
Để xem các bảng và dữ liệu trong Database như một bảng tính Excel:
1. Tải phần mềm **MongoDB Compass** (miễn phí): [https://www.mongodb.com/try/download/compass](https://www.mongodb.com/try/download/compass)
2. Mở MongoDB Compass lên $\rightarrow$ Dán nguyên chuỗi `MONGODB_URI` ở trên vào ô **New Connection**.
3. Bấm nút **Connect**.
4. Bạn sẽ thấy database tên là **`WDP301_GR4`** hiển thị đầy đủ các collection: `users`, `rooms`, `contracts`, `invoices`, `utilityreadings`... Bạn có thể xem, tìm kiếm, sửa hoặc thêm dữ liệu test trực tiếp tại đây!

> ⚠️ **LƯU Ý QUAN TRỌNG VỀ LỖI TIMEOUT KHI KẾT NỐI:**  
> Nếu bạn kết nối bị báo lỗi timeout, hãy báo Leader vào MongoDB Atlas $\rightarrow$ Mục **Network Access** $\rightarrow$ Kiểm tra IP đã được mở **`0.0.0.0/0` (Allow Access from Anywhere)** hay chưa.

---

## 🚀 3. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

Mở 2 tab Terminal riêng biệt trong VS Code:

- **Terminal 1 — Chạy Backend (Port 4000):**
  ```bash
  cd server
  npm install
  npm run dev
  ```
- **Terminal 2 — Chạy Frontend (Port 3000):**
  ```bash
  cd client
  npm install
  npm run dev
  ```
👉 Mở trình duyệt tại: `http://localhost:3000/login`

---

## 🛠️ 4. QUY TRÌNH TẠO MỘT TÍNH NĂNG MỚI (VÍ DỤ: LÀM MODULE `rooms`)

Khi được phân công làm một tính năng (ví dụ: Quản lý phòng trọ `rooms`), thành viên thực hiện theo chuẩn sau:

### PHẦN 1: BÊN SERVER (`server/src/`)

1. **Sử dụng bảng DB:** Bảng đã có sẵn trong `server/src/models/Rooms.js` (hoặc tạo mới nếu chưa có).
2. **Tạo thư mục module:** Tạo `server/src/modules/rooms/` gồm đúng **3 file cốt lõi**:
   - `rooms.service.js`: Viết các hàm xử lý logic, gọi DB. Kiểm tra điều kiện và `throw { status: 400, message: "..." }`.
   - `rooms.controller.js`: Nhận `(req, res)`, gom `data`, gọi hàm từ service và trả kết quả qua `sendSuccess` / `sendError`.
   - `rooms.route.js`: Khai báo các đường dẫn con (`/`, `/:id`, `/create`...).
3. **Đăng ký vào Route Tổng:** Mở `server/src/app/routes.js` và thêm đúng 2 dòng:
   ```javascript
   import roomRoutes from '../modules/rooms/rooms.route.js';
   // ...
   router.use('/rooms', roomRoutes); // -> API sẽ là: /api/rooms/...
   ```

---

### PHẦN 2: BÊN CLIENT (`client/src/`)

1. **Tạo thư mục feature:** Tạo `client/src/features/rooms/` gồm các thư mục con theo chuẩn:
   ```text
   features/rooms/
   ├── api/             # rooms-api.jsx (Gọi api.get('/rooms'), api.post('/rooms')...)
   ├── components/      # RoomCard.jsx, RoomFormModal.jsx...
   ├── hooks/           # useRooms.jsx (Xử lý state, gọi api, loading...)
   ├── pages/           # RoomListPage.jsx, RoomDetailPage.jsx...
   └── routes/          # roomRoutes.jsx
   ```
2. **Khai báo routes của feature:** Trong `features/rooms/routes/roomRoutes.jsx`:
   ```javascript
   import RoomListPage from '../pages/RoomListPage';

   const roomRoutes = [
     { path: '/rooms', element: <RoomListPage /> }
   ];
   export default roomRoutes;
   ```
3. **Nối vào AppRoutes:** Mở `client/src/app/routes/AppRoutes.jsx` và nối mảng routes vào hệ thống.

---

## 🎨 5. QUY CHUẨN MÀU SẮC & GIAO DIỆN (TAILWIND CSS)

Dự án sử dụng tông màu chủ đạo **Xanh lục ngọc bảo hiện đại (Emerald Green)**.  
**TUYỆT ĐỐI KHÔNG TỰ BỊA MÃ MÀU HEX!** Tất cả thành viên bắt buộc sử dụng các class quy ước sẵn trong `tailwind.config.js`:

- **Nút chính / Điểm nhấn:** `bg-primary`, `hover:bg-primary-dark`, `text-primary`
- **Nút Gradient sang trọng:** `bg-gradient-emerald`
- **Nền toàn app:** `bg-surface-bg`
- **Nền thẻ Card / Modal / Bảng:** `bg-surface-card border border-surface-border`
- **Chữ chính / Giá tiền / Tiêu đề:** `text-content-main`
- **Chữ phụ / Ngày tháng / Mô tả:** `text-content-sub`
- **Huy hiệu trạng thái (Badge):**
  - Đã thanh toán / Còn phòng: `text-status-success`
  - Chờ duyệt / Sắp hết hạn: `text-status-warning`
  - Quá hạn / Báo hỏng / Huỷ: `text-status-danger`
  - Thông báo / Ghi chú: `text-status-info`

---

## ⚠️ 6. QUY TẮC LÀM VIỆC VỚI GIT ĐỂ KHÔNG BỊ CONFLICT

1. **Luôn kéo code mới nhất trước khi làm việc:**
   ```bash
   git pull origin main
   ```
2. **Không commit file cấu hình cá nhân:** Tuyệt đối không xóa dòng trong `.gitignore`. File `.env` không bao giờ được đẩy lên Git.
3. **Mỗi người làm việc trên Module của mình:** Hạn chế chỉnh sửa các file ở thư mục `shared/` hoặc `app/` nếu không có sự thống nhất của cả nhóm.
