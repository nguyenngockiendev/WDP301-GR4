import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  const { login, loading, error } = useLogin();

  const navigate = useNavigate();

  const onSubmit = async data => {
    try {
      const result = await login(data);

      if (result) {
        localStorage.setItem('token', result);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <LoginForm
      register={register}
      handleSubmit={handleSubmit}
      login={login}
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      navigate={navigate}
      errors={errors}
    />
  );
};

export default Login;
