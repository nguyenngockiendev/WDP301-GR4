import api from '../../../shared/api/axiosClient';
import propertiesAPI from '../../properties/api/properties-api';
import contractsAPI from '../../contracts/api/contracts-api';

export const getInvoicePropertiesAPI = () => propertiesAPI.getMyProperties();

export const getInvoiceContractsAPI = propertyId => contractsAPI.getContractsByProperty(propertyId);

export const previewInvoiceAPI = data => {
  const request = api.post('/invoices/preview', data);
  return request;
};

export const createInvoiceAPI = data => {
  const request = api.post('/invoices', data);
  return request;
};

export const getMyInvoicesAPI = signal => api.get('/invoices/my', { signal });

export const getMyInvoiceAPI = (invoiceId, signal) =>
  api.get(`/invoices/my/${encodeURIComponent(invoiceId)}`, { signal });

export const getManagedInvoicesAPI = (params, signal) => api.get('/invoices', { params, signal });

export const getManagedInvoiceAPI = (invoiceId, signal) =>
  api.get(`/invoices/${encodeURIComponent(invoiceId)}`, { signal });

export const sendInvoicesAPI = invoiceIds => api.post('/invoices/send', { invoiceIds });

export const createInvoicePaymentAPI = data => api.post('/payments/vnpay/invoice', data);

export const getInvoicePaymentStatusAPI = (paymentCode, signal) =>
  api.get(`/payments/status/${encodeURIComponent(paymentCode)}`, { signal });
