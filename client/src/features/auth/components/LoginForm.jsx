import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Home,
  ShieldCheck,
  Building,
  KeyRound,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const LoginForm = ({
  register,
  handleSubmit,
  loading,
  error,
  onSubmit,
  errors,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface-bg select-none relative overflow-hidden">
      {/* Hiệu ứng đốm mờ nền Emerald */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-100/60 filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent-light/20 filter blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl bg-surface-card border border-surface-border rounded-2xl shadow-card grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          {/* Logo & Tên dự án */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-emerald flex items-center justify-center text-white shadow-soft">
              <Home size={22} className="stroke-[2.5]" />
              </div>
            <div>
              <span className="font-extrabold text-xl text-content-main tracking-tight block">
                Haven Stay
              </span>
              <span className="text-[11px] font-semibold text-primary block -mt-1">
                Hệ thống Quản lý Nhà trọ & Căn hộ
              </span>
            </div>
            </div>

          <div className="mb-6">
            <h1 className="text-2xl font-black text-content-main tracking-tight">
              Đăng Nhập
              </h1>
            <p className="text-xs font-medium text-content-sub mt-1">
              Nhập tài khoản của bạn để truy cập bảng điều khiển phòng trọ.
              </p>
            </div>

          {/* Báo lỗi nếu có */}
            {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-status-danger text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-main">
                  Địa chỉ Email
                </label>
              <div className="relative rounded-xl bg-surface-bg border border-surface-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                  <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                  placeholder="chu_tro@example.com"
                  {...register('email')}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-medium text-content-main placeholder-content-muted bg-transparent outline-none rounded-xl"
                  />
                </div>
              {errors?.email && (
                <span className="text-[11px] text-status-danger font-medium">
                  {errors.email.message}
                </span>
              )}
              </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-main">
                  Mật khẩu
                </label>
              <div className="relative rounded-xl bg-surface-bg border border-surface-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                  <Lock size={16} />
                  </div>
                  <input
                  type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                  {...register('password')}
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-medium text-content-main placeholder-content-muted bg-transparent outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-content-muted hover:text-content-main transition-colors cursor-pointer"
                  >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              {errors?.password && (
                <span className="text-[11px] text-status-danger font-medium">
                  {errors.password.message}
                </span>
              )}

              <div className="flex justify-end pt-1">
                  <Link
                    to="/forgot-password"
                  className="text-[11px] font-bold text-content-sub hover:text-primary transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
              </div>

            {/* Nút Đăng nhập */}
              <button
                type="submit"
                disabled={loading}
              className="w-full py-3 px-6 rounded-modern text-white text-xs font-bold bg-gradient-emerald hover:opacity-95 active:scale-[0.99] shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                  <span>Vào Bảng Điều Khiển</span>
                  <ArrowRight size={16} />
                  </>
                )}
              </button>

            <p className="text-center text-xs font-medium text-content-sub pt-2">
              Chưa có tài khoản quản lý?{' '}
                <Link
                  to="/register"
                className="font-bold text-primary hover:text-primary-dark underline underline-offset-2"
                >
                Đăng ký ngay
                </Link>
              </p>
            </form>
          </div>

        {/* CỘT PHẢI: BANNER GIỚI THIỆU TÍNH NĂNG QUẢN LÝ NHÀ TRỌ (TÔNG XANH LỤC) */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-sidebar text-white relative">
                  <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-primary-200 mb-6">
              <Building size={14} />
              <span>Smart Property Management 2026</span>
                  </div>

            <h2 className="text-2xl font-black leading-snug tracking-tight mb-3">
              Quản lý dãy trọ & căn hộ thông minh, chính xác từng số điện nước.
            </h2>
            <p className="text-xs text-primary-100/80 leading-relaxed font-normal">
              Theo dõi hợp đồng khách thuê, tính hóa đơn tự động và cập nhật chỉ số điện nước hàng tháng theo thời gian thực.
            </p>
                </div>

          {/* 3 Thẻ tính năng nhỏ */}
          <div className="space-y-3 my-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light">
                <Home size={16} />
                </div>
                <div>
                <p className="text-xs font-bold leading-tight">Quản lý Phòng Trống & Đang Thuê</p>
                <p className="text-[10px] text-primary-200/70">Theo dõi trạng thái phòng tức thì</p>
              </div>
                  </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light">
                <KeyRound size={16} />
              </div>
                <div>
                <p className="text-xs font-bold leading-tight">Hợp Đồng & Tiền Cọc Minh Bạch</p>
                <p className="text-[10px] text-primary-200/70">Tự động cảnh báo khi sắp hết hạn thuê</p>
                  </div>
                </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light">
                <ShieldCheck size={16} />
                </div>
              <div>
                <p className="text-xs font-bold leading-tight">Chốt Điện Nước & Xuất Hoá Đơn</p>
                <p className="text-[10px] text-primary-200/70">Gửi thông báo số tiền trực tiếp cho khách</p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-primary-200/60 font-medium">
            © 2026 WDP301-GR4 — Nền tảng quản lý lưu trú thế hệ mới
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
