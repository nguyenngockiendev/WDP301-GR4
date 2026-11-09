import { useEffect, useState } from 'react';
import { getMyInvoiceAPI, getMyInvoicesAPI } from '../api/invoices-api';

export default function useTenantInvoices(invoiceId) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState(null);
  const requestKey = `${invoiceId || 'list'}:${retryCount}`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadInvoices() {
      try {
        const response = invoiceId
          ? await getMyInvoiceAPI(invoiceId, controller.signal)
          : await getMyInvoicesAPI(controller.signal);
        if (controller.signal.aborted) return;
        const validData = invoiceId
          ? response?.data?._id === invoiceId.toLowerCase()
          : Array.isArray(response?.data);
        if (!response?.success || !validData) {
          setResult({ requestKey, data: null, error: 'Dữ liệu hóa đơn không hợp lệ.' });
          return;
        }
        setResult({ requestKey, data: response.data, error: '' });
      } catch (error) {
        if (controller.signal.aborted) return;
        setResult({
          requestKey,
          data: null,
          error: error.response?.data?.message || 'Không tải được hóa đơn. Vui lòng thử lại.',
        });
      }
    }

    loadInvoices();
    return () => controller.abort();
  }, [invoiceId, requestKey]);

  const currentResult = result?.requestKey === requestKey ? result : null;
  return {
    loading: !currentResult,
    data: currentResult?.data,
    error: currentResult?.error,
    reload: () => setRetryCount(count => count + 1),
  };
}
