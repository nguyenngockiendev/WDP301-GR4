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
