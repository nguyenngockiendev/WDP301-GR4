import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import useLogin from '../hooks/uselogin';
import LoginForm from '../components/LoginForm';
import { toast } from 'react-toastify';
import { saveToken, decodeToken, getPostLoginPath } from '../../../shared/utils/auth';

import { jwtDecode } from 'jwt-decode';
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
  const location = useLocation();

  // Về lại trang trước khi bị bắt đăng nhập (vd: /home), nếu không có thì theo vai trò
  const goAfterLogin = token => {
    const role = decodeToken(token)?.role;
    navigate(getPostLoginPath(location.state?.from, role), { replace: true });
  };

  const onSubmit = async data => {
    const result = await login(data);
    if (result) {
      const token = result.data?.token || result.data?.user;
      saveToken(token);
      goAfterLogin(token);
    }
  };

  const onsumbmitByGG = async googleToken => {
    try {
      const result = await loginGoogle(googleToken);
      if (result) {
        const token = result.data?.token || result.data?.user;
        saveToken(token);
        goAfterLogin(token);
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
