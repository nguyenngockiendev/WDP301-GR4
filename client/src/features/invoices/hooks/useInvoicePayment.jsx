import { useRef, useState } from 'react';
import { createInvoicePaymentAPI } from '../api/invoices-api';

export default function useInvoicePayment() {
  const requestInProgress = useRef(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState('');
  const [paymentError, setPaymentError] = useState('');

  async function payInvoice(invoice) {
    if (requestInProgress.current) return;
    requestInProgress.current = true;
    setPayingInvoiceId(invoice._id);
    setPaymentError('');

    try {
      const response = await createInvoicePaymentAPI({
        invoiceId: invoice._id,
        roomId: invoice.contract.room._id,
      });
      const paymentUrl = response?.data?.paymentUrl;
      if (!response?.success || !paymentUrl) {
        setPaymentError(response?.message || 'Không tạo được link thanh toán VNPay.');
        return;
      }
      window.location.assign(paymentUrl);
    } catch (error) {
      setPaymentError(error.response?.data?.message || 'Không thể mở VNPay. Vui lòng thử lại.');
    } finally {
      requestInProgress.current = false;
      setPayingInvoiceId('');
    }
  }

  return { payInvoice, payingInvoiceId, paymentError };
}
