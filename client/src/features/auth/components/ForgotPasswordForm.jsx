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
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  CheckCircle2,
} from 'lucide-react';

const ForgotPasswordForm = ({
  register,
  handleSubmit,
  loading,
  otpLoading,
  onSubmit,
  handleSendOtp,
  countdown = 0,
  otpSent = false,
  errors,
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-surface-bg select-none relative overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-100/60 filter blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent-light/20 filter blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl bg-surface-card border border-surface-border rounded-2xl shadow-card grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        <div className="p-6 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-2.5 mb-5">
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

          <div className="mb-5">
            <h1 className="text-2xl font-black text-content-main tracking-tight">
              Quên Mật Khẩu
            </h1>
            <p className="text-xs font-medium text-content-sub mt-1">
              Nhập email đã đăng ký để nhận mã OTP và thiết lập mật khẩu mới.
            </p>
          </div>

          {otpSent && (
            <div className="mb-4 p-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-dark text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 size={16} className="flex-shrink-0 text-primary" />
              <span>Mã OTP gồm 6 chữ số đã được gửi tới email của bạn!</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-main">
                Địa chỉ Email nhận mã
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 rounded-xl bg-surface-bg border border-surface-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="chu_tro@example.com"
                    {...register('email')}
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-medium text-content-main placeholder-content-muted bg-transparent outline-none rounded-xl"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || countdown > 0}
                  className="px-3.5 py-2.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-dark border border-primary-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : countdown > 0 ? (
                    <span>Gửi lại ({countdown}s)</span>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Gửi OTP</span>
                    </>
                  )}
                </button>
              </div>
              {errors?.email && (
                <span className="text-[11px] text-status-danger font-medium block">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-main">
                Mã xác thực OTP (6 chữ số)
              </label>
              <div className="relative rounded-xl bg-surface-bg border border-surface-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                  <KeyRound size={16} />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Nhập mã 6 số trong email"
                  {...register('otp')}
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-bold tracking-widest text-content-main placeholder:font-medium placeholder:tracking-normal placeholder-content-muted bg-transparent outline-none rounded-xl"
                />
              </div>
              {errors?.otp && (
                <span className="text-[11px] text-status-danger font-medium block">
                  {errors.otp.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-main">
                Mật khẩu mới
              </label>
              <div className="relative rounded-xl bg-surface-bg border border-surface-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                  <Lock size={16} />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 6 ký tự"
                  {...register('newPassword')}
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-medium text-content-main placeholder-content-muted bg-transparent outline-none rounded-xl"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-content-muted hover:text-content-main transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors?.newPassword && (
                <span className="text-[11px] text-status-danger font-medium block">
                  {errors.newPassword.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-content-main">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative rounded-xl bg-surface-bg border border-surface-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-50 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted">
                  <ShieldCheck size={16} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  {...register('confirmPassword')}
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-medium text-content-main placeholder-content-muted bg-transparent outline-none rounded-xl"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-content-muted hover:text-content-main transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors?.confirmPassword && (
                <span className="text-[11px] text-status-danger font-medium block">
                  {errors.confirmPassword.message}
                </span>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-modern text-white text-xs font-bold bg-gradient-emerald hover:opacity-95 active:scale-[0.99] shadow-soft transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <span>Xác Nhận Đặt Lại Mật Khẩu</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-content-sub hover:text-primary transition-colors"
              >
                <ArrowLeft size={14} />
                <span>Quay lại trang Đăng nhập</span>
              </Link>
            </div>
          </form>
        </div>

        <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-sidebar text-white relative">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-bold text-primary-200 mb-6">
              <Building size={14} />
              <span>Bảo Mật Tài Khoản Haven Stay</span>
            </div>

            <h2 className="text-2xl font-black leading-snug tracking-tight mb-3">
              Khôi phục quyền truy cập nhanh chóng chỉ với 3 bước đơn giản.
            </h2>
            <p className="text-xs text-primary-100/80 leading-relaxed font-normal">
              Hệ thống bảo vệ tài khoản Quản lý và Khách thuê bằng mã xác thực OTP một lần gửi trực tiếp qua email chính chủ.
            </p>
          </div>

          <div className="space-y-3 my-6">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light font-black text-xs">
                01
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Nhập Email & Gửi Yêu Cầu</p>
                <p className="text-[10px] text-primary-200/70">
                  Nhấn nút &ldquo;Gửi OTP&rdquo; để nhận mã xác thực qua hộp thư
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light font-black text-xs">
                02
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Nhập Mã Xác Thực OTP (6 Số)</p>
                <p className="text-[10px] text-primary-200/70">
                  Mã có hiệu lực trong vòng 5 phút kể từ khi gửi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light font-black text-xs">
                03
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Tạo Mật Khẩu Mới An Toàn</p>
                <p className="text-[10px] text-primary-200/70">
                  Đăng nhập lại ngay sau khi hệ thống xác nhận thành công
                </p>
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

export default ForgotPasswordForm;
