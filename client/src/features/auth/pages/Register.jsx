import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useRegister from '../hooks/useRegister';
import useOtp from '../hooks/useSendOtp';
import RegisterForm from '../components/RegisterForm';

const Register = () => {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { register: registerAccount, loading } = useRegister();
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
      toast.warning('Vui lòng nhập địa chỉ Email trước khi nhận mã OTP!');
      return;
    }

    const result = await sendOtp({
      contact: email.trim(),
      purpose: 'register',
    });

    if (result?.success) {
      setOtpSent(true);
      setCountdown(60);
      toast.success(result.message);
    }
  };

  const onSubmit = async (data) => {
    if (data.password !== data.repeatpassword) {
      toast.error('Mật khẩu nhập lại không khớp!');
      return;
    }

    const result = await registerAccount({
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      password: data.password,
      repeatpassword: data.repeatpassword,
      otp: data.otp.trim(),
      purpose: 'register',
    });

    if (result?.success) {
      toast.success(result.message);
      navigate('/login');
    }
  };

  return (
    <RegisterForm
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

export default Register;
