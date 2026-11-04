import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useLogin from '../hooks/uselogin';
import LoginForm from '../components/LoginForm';

const Login = () => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login, loginGoogle, loading } = useLogin();

  const navigate = useNavigate();

  const onSubmit = async data => {
    const result = await login(data);
    if (result?.success) {
      toast.success(result.message);
      navigate('/dashboard');
    }
  };

  const handleGoogleSuccess = async credentialResponse => {
    const googleToken = credentialResponse?.credential;
    const result = await loginGoogle(googleToken);
    if (result?.success) {
      toast.success(result.message);
      navigate('/dashboard');
    }
  };

  const handleGoogleError = () => {
    toast.error('Đăng nhập bằng Google thất bại!');
  };

  return (
    <LoginForm
      register={register}
      handleSubmit={handleSubmit}
      login={login}
      loading={loading}
      onSubmit={onSubmit}
      handleGoogleSuccess={handleGoogleSuccess}
      handleGoogleError={handleGoogleError}
      navigate={navigate}
      errors={errors}
    />
  );
};

export default Login;
