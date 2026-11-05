import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Send,
  UserPlus,
  Building2,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

const RegisterForm = ({
  register,
  handleSubmit,
  loading,
  otpLoading,
  onSubmit,
  handleSendOtp,
  countdown = 0,
  otpSent = false,
  errors = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-bg relative overflow-hidden p-4 md:p-6 font-sans">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl bg-surface-card border border-surface-border rounded-[24px] shadow-card overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10">
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-sidebar p-10 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-1/3 -left-12 w-40 h-40 bg-primary-light/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-emerald flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-wide block leading-none">
                  HAVEN STAY
                </span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  Smart Boarding House
                </span>
              </div>
            </div>

            <h2 className="text-3xl font-bold leading-tight mb-4">
              Bắt đầu hành trình quản lý nhà trọ thông minh
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Đăng ký tài khoản nhanh chóng với xác thực OTP bảo mật để kết nối trực tiếp vào hệ sinh thái quản lý phòng trọ, hợp đồng và hóa đơn.
            </p>
          </div>

          <div className="relative z-10 space-y-3.5 my-8">
            <div className="flex items-start gap-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Trải nghiệm đồng bộ</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Theo dõi hợp đồng thuê, chỉ số điện nước và thanh toán trực tuyến mọi lúc mọi nơi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-lg bg-primary/30 text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">An toàn & Minh bạch</h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Xác thực tài khoản qua mã OTP giúp bảo vệ dữ liệu cá nhân và thông tin lưu trú.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span>© 2026 Haven Stay System</span>
            <span className="text-emerald-300 font-medium">WDP301 - GR4</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-subtle text-primary text-xs font-semibold mb-3">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tạo tài khoản mới</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content-main tracking-tight">
              Đăng ký thành viên
            </h1>
            <p className="text-sm text-content-sub mt-1.5">
              Điền thông tin cá nhân và xác thực mã OTP từ Email để kích hoạt tài khoản.
            </p>
          </div>

          {otpSent && (
            <div className="mb-5 p-3.5 rounded-modern bg-primary-subtle border border-primary/20 flex items-start gap-2.5 text-primary-dark text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              <span>
                Mã xác thực OTP đã được gửi đến Email của bạn. Vui lòng kiểm tra hộp thư!
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    {...register('name', {
                      required: 'Vui lòng nhập họ và tên',
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-bg border border-surface-border rounded-modern text-sm text-content-main placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                  />
                </div>
                {errors?.name && (
                  <p className="text-xs text-status-danger mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    {...register('phone', {
                      required: 'Vui lòng nhập số điện thoại',
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-bg border border-surface-border rounded-modern text-sm text-content-main placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                  />
                </div>
                {errors?.phone && (
                  <p className="text-xs text-status-danger mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
                Địa chỉ Email
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    {...register('email', {
                      required: 'Vui lòng nhập địa chỉ Email',
                    })}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-bg border border-surface-border rounded-modern text-sm text-content-main placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || countdown > 0}
                  className="px-4 py-2.5 rounded-modern font-semibold text-xs sm:text-sm bg-primary-subtle text-primary border border-primary/25 hover:bg-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {otpLoading
                    ? 'Đang gửi...'
                    : countdown > 0
                    ? `Gửi lại (${countdown}s)`
                    : otpSent
                    ? 'Gửi lại OTP'
                    : 'Nhận mã OTP'}
                </button>
              </div>
              {errors?.email && (
                <p className="text-xs text-status-danger mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
                Mã xác thực OTP
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Nhập mã 6 chữ số gửi về Email"
                  {...register('otp', {
                    required: 'Vui lòng nhập mã OTP xác thực',
                  })}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-bg border border-surface-border rounded-modern text-sm font-semibold tracking-widest text-content-main placeholder:font-normal placeholder:tracking-normal placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                />
              </div>
              {errors?.otp && (
                <p className="text-xs text-status-danger mt-1">{errors.otp.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tối thiểu 6 ký tự"
                    {...register('password', {
                      required: 'Vui lòng nhập mật khẩu',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự',
                      },
                    })}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-bg border border-surface-border rounded-modern text-sm text-content-main placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-main transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors?.password && (
                  <p className="text-xs text-status-danger mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-main uppercase tracking-wider mb-1.5">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-content-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showRepeatPassword ? 'text' : 'password'}
                    placeholder="Nhập lại mật khẩu"
                    {...register('repeatpassword', {
                      required: 'Vui lòng nhập lại mật khẩu',
                    })}
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-bg border border-surface-border rounded-modern text-sm text-content-main placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-main transition-colors"
                  >
                    {showRepeatPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors?.repeatpassword && (
                  <p className="text-xs text-status-danger mt-1">
                    {errors.repeatpassword.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 mt-2 bg-gradient-emerald hover:opacity-95 text-white font-semibold text-sm rounded-modern shadow-soft transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Đang xử lý đăng ký...' : 'Đăng ký tài khoản'}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-surface-border text-center">
            <p className="text-sm text-content-sub">
              Bạn đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary hover:text-primary-dark transition-colors"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
