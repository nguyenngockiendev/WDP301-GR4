import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useFogotPass from '../hooks/useForgotPassword';
import useOtp from '../hooks/useSendOtp';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { forgotPassword, loading } = useFogotPass();
  const { sendOtp, loading: otpLoading } = useOtp();

  const [countdown, setCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    const email = getValues('email');
    if (!email || !email.trim()) {
      toast.warning('Vui lòng nhập địa chỉ Email trước khi lấy mã OTP!');
      return;
    }

    const result = await sendOtp({
      contact: email.trim(),
      purpose: 'forgot_password',
    });

    if (result?.success) {
      setOtpSent(true);
      setCountdown(60);
      toast.success(result.message);
    }
  };

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    const result = await forgotPassword({
      email: data.email.trim(),
      otp: data.otp.trim(),
      newPassword: data.newPassword,
      purpose: 'forgot_password',
    });

    if (result?.success) {
      toast.success(result.message);
      navigate('/login');
    }
  };

  return (
    <ForgotPasswordForm
      register={register}
      handleSubmit={handleSubmit}
      loading={loading}
      otpLoading={otpLoading}
      onSubmit={onSubmit}
      handleSendOtp={handleSendOtp}
      countdown={countdown}
      otpSent={otpSent}
      errors={errors}
      navigate={navigate}
    />
  );
};

export default ForgotPassword;
