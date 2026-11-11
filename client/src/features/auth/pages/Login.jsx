import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useLogin from '../hooks/uselogin';
import LoginForm from '../components/LoginForm';
import { saveToken, getDefaultPathForRole } from '../../../shared/utils/auth';

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
  const finishLogin = token => {
    saveToken(token);
    window.dispatchEvent(new Event('auth-changed'));
    navigate(getDefaultPathForRole(), { replace: true });
  };

  const onSubmit = async data => {
    const result = await login(data);
    if (result) {
      const token = result.data?.token || result.data?.user;
      finishLogin(token);
    }
  };

  const onsumbmitByGG = async googleToken => {
    try {
      const result = await loginGoogle(googleToken);
      if (result) {
        const token = result.data?.token || result.data?.user;
        finishLogin(token);
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
