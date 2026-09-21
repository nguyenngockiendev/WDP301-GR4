# Haven — React frontend + Node.js backend

Dự án làm việc: `E:\Giáo trình WDP301\WDP301`. Cấu trúc tách FE/BE theo code mẫu. Frontend React dùng Vite để build; backend Express cung cấp JSON API, không render EJS. Giao diện tiếng Anh.

```text
backend/
  src/
    config/
    controllers/
    services/
    dao/
    entities/
    dto/
    middleware/
    app.js
    server.js
  scripts/
  test/
  uploads/
  create-admin.js
  create-indexes.js
  package.json
  .env.example
frontend/
  public/
  src/
    components/    Header, Footer, Sidebar, Layout
    context/       AuthContext
    pages/         Auth, Dashboard, Profile, Management, Records
    services/      JSON API client
    App.jsx
    main.jsx
    styles.css
  index.html
  vite.config.js
  package.json
docs/MONGODB.md
```

Backend giữ kiến trúc controller → service → DAO → entity và DTO. Frontend không truy cập MongoDB; chỉ gọi `/api`. Header/Footer/Sidebar là React components dùng chung.

## Chạy dự án

Cần Node.js 22.12+. Mỗi thư mục có package.json và package-lock.json riêng.

```powershell
npm ci --prefix backend
npm ci --prefix frontend
```

Mỗi thành viên tạo `backend/.env` từ `backend/.env.example`. Để cả nhóm dùng chung dữ liệu, điền cùng một MongoDB Atlas connection string vào `MONGODB_URI`; chuỗi kết nối không được commit hoặc gửi trong chat nhóm. Hướng dẫn tạo và phân quyền database nằm tại [docs/TEAM_MONGODB.md](docs/TEAM_MONGODB.md). `SESSION_SECRET` phải giống nhau giữa các máy khi cần chia sẻ session, nhưng không được đưa vào Git.

Terminal 1 tại thư mục gốc:

```powershell
npm run dev:backend
```

Terminal 2 tại thư mục gốc:

```powershell
npm run dev:frontend
```

Frontend: http://localhost:3000. Backend: http://127.0.0.1:4000/api. Vite proxy `/api` sang backend, cookie session HttpOnly và CSRF token bảo vệ các thao tác ghi; không lưu JWT trong localStorage. Không cần mở CORS cho mọi origin.

Các lệnh khác:

```powershell
npm --prefix backend run db:init
npm --prefix backend run seed
npm test
npm run build
npm run format:check
```

Code style is enforced by Prettier for every source, JSON, CSS and Markdown file. Run `npm run format` before committing; it keeps imports, objects, functions and JSX consistently spaced and split into readable lines.

Seed không ghi đè tài khoản đã có. Build React tạo `frontend/dist`. Production cần web server phục vụ dist, fallback index.html cho React routes và reverse proxy `/api` về backend, dùng HTTPS và cấu hình trust proxy phù hợp; Vite dev proxy không phải cấu hình production.

## API

- GET `/api/session`: người dùng hiện tại, CSRF token, menu được phép.
- POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`.
- PATCH `/api/profile`.
- GET/POST `/api/users`; GET `/api/users/:id` (Landlord).
- GET/POST `/api/rooms`; GET `/api/rooms/:id`; PATCH `/api/rooms/:id/manager`.
- GET `/api/dashboard`, `/api/workspace/:module`.

Requests ghi gửi JSON và header `X-CSRF-Token`, cookie cùng phiên. Refresh `/api/session` sau đăng nhập vì session/token được xoay.

## Phạm vi

Đã hoạt động: đăng ký, đăng nhập, đăng xuất, hồ sơ, danh sách/thêm/chi tiết người dùng, danh sách/thêm/chi tiết phòng và phân công quản lý, dashboard và các trang xem dữ liệu phân quyền.

Role: ADMIN (Landlord), MANAGER (Property Manager), TENANT (Tenant). Các trang hợp đồng, hóa đơn, thanh toán, tiền cọc, yêu cầu, điện nước và cấu hình vẫn chỉ xem dữ liệu. Chưa thực hiện các workflow tạo/duyệt hợp đồng, thanh toán, gửi OTP. Xem `docs/MONGODB.md` và `ROLE_PERMISSIONS.md`.
