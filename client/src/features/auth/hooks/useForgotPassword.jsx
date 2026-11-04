import { useState } from 'react';
import { forgotPasswordAPI } from '../api/auth-api';
import { toast } from 'react-toastify';

const useFogotPass = () => {
  const [loading, setLoading] = useState(false);

  const forgotPassword = async data => {
    try {
      setLoading(true);
      const res = await forgotPasswordAPI(data);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Lỗi đặt lại mật khẩu';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { forgotPassword, loading };
};

export default useFogotPass;
