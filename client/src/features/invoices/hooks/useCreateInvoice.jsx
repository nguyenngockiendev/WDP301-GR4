import { useEffect, useState } from 'react';
import {
  createInvoiceAPI,
  getInvoiceContractsAPI,
  getInvoicePropertiesAPI,
  previewInvoiceAPI,
} from '../api/invoices-api';

const monthPattern = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;

function getCurrentMonth() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return date.getFullYear() + '-' + month;
}

function isContractInMonth(contract, billingMonth) {
  if (!monthPattern.test(billingMonth)) return false;
  if (!['active', 'expired'].includes(contract.status)) return false;

  const [year, month] = billingMonth.split('-').map(Number);
  const startOfMonth = new Date(billingMonth + '-01T00:00:00+07:00');
  const endOfMonth = Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000;
  return new Date(contract.startDate) < endOfMonth && new Date(contract.endDate) >= startOfMonth;
}

function readInvoiceResponse(response) {
  const invoice = response?.data;
  const validItems = Array.isArray(invoice?.items) && invoice.items.length > 0 &&
    invoice.items.every(item => Number.isFinite(item?.amount));

  if (!response?.success || !validItems || !Number.isFinite(invoice.totalAmount) ||
      invoice.totalAmount < 0 || !invoice.dueDate || !Number.isFinite(Date.parse(invoice.dueDate))) {
    throw new Error(response?.success === false && response.message
      ? response.message
      : 'Dữ liệu hóa đơn trả về chưa đầy đủ.');
  }
  return invoice;
}

export default function useCreateInvoice({ initialPropertyId, initialRoomId, initialBillingMonth }) {
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [billingMonth, setBillingMonth] = useState(
    () => monthPattern.test(initialBillingMonth) ? initialBillingMonth : getCurrentMonth(),
  );
  const [selectedContractId, setSelectedContractId] = useState('');
  const [preferredRoomId, setPreferredRoomId] = useState(initialRoomId);
  const [contractData, setContractData] = useState({ propertyId: '', contracts: [], error: '' });
  const [propertyError, setPropertyError] = useState('');
  const [selectionWarning, setSelectionWarning] = useState('');
  const [preview, setPreview] = useState(null);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [invoiceError, setInvoiceError] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProperties = async () => {
      try {
        const response = await getInvoicePropertiesAPI();
        if (!active) return;

        const list = response.data || [];
        setProperties(list);
        if (initialPropertyId) {
          const selected = list.find(property => property._id === initialPropertyId);
          setPropertyId(selected?._id || '');
          if (!selected) {
            setSelectionWarning('Bạn chưa có quyền với nhà trọ trong liên kết. Hãy chọn lại nhà trọ.');
            setPreferredRoomId('');
          }
        } else {
          const currentPropertyId = localStorage.getItem('currentPropertyId');
          const selected = list.find(property => property._id === currentPropertyId) || list[0];
          setPropertyId(selected?._id || '');
        }
      } catch (error) {
        if (active) setPropertyError(error.response?.data?.message || 'Không tải được danh sách nhà trọ.');
      } finally {
        if (active) setLoadingProperties(false);
      }
    };

    loadProperties();
    return () => { active = false; };
  }, [initialPropertyId]);

  useEffect(() => {
    if (!propertyId) return;
    let active = true;

    const loadContracts = async () => {
      try {
        const response = await getInvoiceContractsAPI(propertyId);
        if (active) setContractData({ propertyId, contracts: response.data || [], error: '' });
      } catch (error) {
        if (active) {
          setContractData({
            propertyId,
            contracts: [],
            error: error.response?.data?.message || 'Không tải được danh sách hợp đồng.',
          });
        }
      }
    };

    loadContracts();
    return () => { active = false; };
  }, [propertyId]);

  const loadingContracts = Boolean(propertyId && contractData.propertyId !== propertyId);
  const validMonth = monthPattern.test(billingMonth);
  const availableContracts = loadingContracts || !propertyId
    ? []
    : contractData.contracts.filter(contract => isContractInMonth(contract, billingMonth));
  const roomContracts = preferredRoomId
    ? availableContracts.filter(contract => String(contract.room?._id || contract.room) === preferredRoomId)
    : [];
  const contract = availableContracts.find(item => item._id === selectedContractId) ||
    (roomContracts.length === 1 ? roomContracts[0] : null);
  const property = properties.find(item => item._id === propertyId);
  const busy = previewing || creating;

  const clearInvoice = () => {
    setPreview(null);
    setCreatedInvoice(null);
    setInvoiceError('');
  };

  const selectProperty = id => {
    if (id === propertyId) return;
    setPropertyId(id);
    setContractData({ propertyId: '', contracts: [], error: '' });
    setPreferredRoomId('');
    setSelectedContractId('');
    setSelectionWarning('');
    clearInvoice();
  };

  const selectMonth = value => {
    setBillingMonth(value);
    setSelectedContractId('');
    clearInvoice();
  };

  const selectContract = id => {
    setSelectedContractId(id);
    setPreferredRoomId('');
    clearInvoice();
  };

  const previewInvoice = async () => {
    if (!contract || !validMonth || busy || createdInvoice) return;

    try {
      setPreviewing(true);
      setInvoiceError('');
      setPreview(null);
      const data = { contractId: contract._id, billingMonth };
      const response = await previewInvoiceAPI(data);
      setPreview(readInvoiceResponse(response));
    } catch (error) {
      setInvoiceError(error.response?.data?.message || error.message || 'Không xem trước được hóa đơn.');
    } finally {
      setPreviewing(false);
    }
  };

  const createInvoice = async () => {
    if (!preview || !contract || !validMonth || busy || createdInvoice) return;

    try {
      setCreating(true);
      setInvoiceError('');
      const data = {
        contractId: contract._id,
        billingMonth,
        expectedTotalAmount: preview.totalAmount,
      };
      const response = await createInvoiceAPI(data);
      const invoice = readInvoiceResponse(response);
      setCreatedInvoice(invoice);
    } catch (error) {
      if (error.response?.status === 409) setPreview(null);
      setInvoiceError(error.response?.data?.message || error.message || 'Không tạo được hóa đơn.');
    } finally {
      setCreating(false);
    }
  };

  return {
    properties, property, propertyId, billingMonth, validMonth, contract, availableContracts,
    loadingProperties, loadingContracts, selectionWarning,
    loadError: propertyError || (!loadingContracts && propertyId ? contractData.error : ''),
    preferredRoomUnavailable: Boolean(preferredRoomId && !loadingContracts && validMonth && !roomContracts.length),
    selectProperty, selectMonth, selectContract,
    preview, previewing, previewInvoice, createdInvoice, creating, createInvoice, invoiceError, busy,
  };
}
