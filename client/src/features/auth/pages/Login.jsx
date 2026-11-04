import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useLogin from '../hooks/uselogin';
import LoginForm from '../components/LoginForm';
import {jwtDecode} from 'jwt-decode';
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
      localStorage.setItem('token', result.data.user);
      const userid = jwtDecode(result.data.user);
      localStorage.setItem('userId', userid?.userId);
      toast.success(result.message);
      navigate('/dashboard');
    }
  };

  const onsumbmitByGG = async googleToken => {
    try {
      const result = await loginGoogle(googleToken);
      if (result) {
        const tokenString = result.data.user;
        localStorage.setItem('token', tokenString);
        const userid = jwtDecode(tokenString);
        localStorage.setItem('userId', userid?.userId);
        navigate('/dashboard');
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <LoginForm
      register={register}
      handleSubmit={handleSubmit}
      login={login}
      loading={loading}
      onSubmit={onSubmit}
      onsumbmitByGG={onsumbmitByGG}
      navigate={navigate}
      errors={errors}
    />
  );
};

export default Login;
