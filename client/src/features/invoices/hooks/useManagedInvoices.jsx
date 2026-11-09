import { useEffect, useState } from 'react';
import {
  getInvoicePropertiesAPI, getManagedInvoiceAPI, getManagedInvoicesAPI,
} from '../api/invoices-api';

export default function useManagedInvoices({ invoiceId, requestedPropertyId, billingMonth, sendStatus }) {
  const [properties, setProperties] = useState(null);
  const [propertyError, setPropertyError] = useState('');
  const [result, setResult] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (invoiceId) return;
    let active = true;

    async function loadProperties() {
      try {
        const response = await getInvoicePropertiesAPI();
        if (active) setProperties(response.data || []);
      } catch (error) {
        if (active) setPropertyError(error.response?.data?.message || 'Không tải được danh sách nhà trọ.');
      }
    }

    loadProperties();
    return () => { active = false; };
  }, [invoiceId]);

  const preferredPropertyId = requestedPropertyId || localStorage.getItem('currentPropertyId');
  const property = properties?.find(item => item._id === preferredPropertyId) || properties?.[0];
  const propertyId = property?._id || '';
  const canLoad = Boolean(invoiceId || (propertyId && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(billingMonth)));
  const requestKey = invoiceId ? `${invoiceId}:${reloadCount}` : `${propertyId}:${billingMonth}:${sendStatus}:${reloadCount}`;

  useEffect(() => {
    if (!canLoad) return;
    const controller = new AbortController();

    async function loadInvoices() {
      try {
        const response = invoiceId
          ? await getManagedInvoiceAPI(invoiceId, controller.signal)
          : await getManagedInvoicesAPI({ propertyId, billingMonth, sendStatus }, controller.signal);
        if (controller.signal.aborted) return;
        const validData = invoiceId ? response?.data?._id === invoiceId.toLowerCase() : Array.isArray(response?.data);
        if (!response?.success || !validData) {
          setResult({ requestKey, error: 'Dữ liệu hóa đơn không hợp lệ.' });
          return;
        }
        setResult({ requestKey, data: response.data });
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ requestKey, error: error.response?.data?.message || 'Không tải được hóa đơn.' });
        }
      }
    }

    loadInvoices();
    return () => controller.abort();
  }, [invoiceId, propertyId, billingMonth, sendStatus, requestKey, canLoad]);

  const currentResult = canLoad && result?.requestKey === requestKey ? result : null;
  return {
    properties: properties || [],
    propertyId,
    loadingProperties: !invoiceId && !properties && !propertyError,
    loading: canLoad && !currentResult,
    data: currentResult?.data,
    error: propertyError || currentResult?.error,
    reload: () => setReloadCount(count => count + 1),
  };
}
