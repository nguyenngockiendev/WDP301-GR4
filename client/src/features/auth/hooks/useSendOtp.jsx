import { useState } from 'react';
import { toast } from 'react-toastify';
import { sendOtpAPI } from '../api/auth-api';

const useOtp = () => {
  const [loading, setLoading] = useState(false);

  const sendOtp = async datas => {
    try {
      const data = {
        contact: datas.contact,
        purpose: datas.purpose,
      };
      setLoading(true);
      const res = await sendOtpAPI(data);
      return res;
    } catch (err) {
      const message = err.response?.data?.message || 'Gui OTP that bai';
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { sendOtp, loading };
};

export default useOtp;
