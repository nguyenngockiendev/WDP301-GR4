import { useEffect, useState } from 'react';
import { getInvoicePaymentStatusAPI } from '../api/invoices-api';

export default function useInvoicePaymentStatus(paymentCode) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${paymentCode}:${refreshCount}`;

  useEffect(() => {
    const controller = new AbortController();
    let timer;
    let checks = 0;

    async function loadStatus() {
      try {
        const response = await getInvoicePaymentStatusAPI(paymentCode, controller.signal);
        if (controller.signal.aborted) return;
        if (!response?.success || !response.data) {
          setResult({ requestKey, error: response?.message || 'Không đọc được kết quả thanh toán.' });
          return;
        }
        const payment = response.data;
        setResult({ requestKey, payment });
        checks += 1;
        if (payment.status === 'pending' && checks < 10) timer = setTimeout(loadStatus, 2000);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ requestKey, error: error.response?.data?.message || 'Không tải được trạng thái thanh toán.' });
        }
      }
    }

    loadStatus();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [paymentCode, requestKey]);

  const currentResult = result?.requestKey === requestKey ? result : null;
  return {
    payment: currentResult?.payment,
    loading: !currentResult,
    error: currentResult?.error,
    refresh: () => setRefreshCount(count => count + 1),
  };
}
