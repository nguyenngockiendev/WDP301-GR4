import { useState } from 'react';
import { loginUser } from '../api/auth-api';
import { toast } from 'react-toastify';

const useLogin = () => {
  const [loading, setLoading] = useState(false);

  const login = async data => {
    try {
      setLoading(true);

      const res = await loginUser(data.email, data.password);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login};
};

export default useLogin;
