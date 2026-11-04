import { useState } from 'react';

import { toast } from 'react-toastify';
import { registerUserAPI } from '../api/auth-api';

const useRegister = () => {
  const [loading, setLoading] = useState(false);

  const register = async data => {
    try {
      setLoading(true);
      const res = await registerUserAPI(data);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Lỗi đăng ký';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  return { register, loading };
};

export default useRegister;
