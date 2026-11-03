import { useState } from 'react';
import { loginUser } from '../api/auth-api';
import { toast } from 'react-toastify';

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async data => {
    try {
      setLoading(true);
      setError('');

      const res = await loginUser(data.identifier || data.email, data.password);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

export default useLogin;
