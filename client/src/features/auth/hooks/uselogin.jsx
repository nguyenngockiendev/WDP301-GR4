import { useState } from 'react';
import { loginUserAPI } from '../api/auth-api';
import { toast } from 'react-toastify';

const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = async data => {
    try {
      setLoading(true);

      const res = await loginUserAPI(data.email, data.password);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Lỗi đăng nhập';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};

export default useLogin;
