import propertiesAPI from '../../properties/api/properties-api';
import roomsAPI from '../../rooms/api/rooms-api';
import contractsAPI from '../../contracts/api/contracts-api';
import api from '../../../shared/api/axiosClient';

export const getUtilityPropertiesAPI = () => propertiesAPI.getMyProperties();

export const getUtilityRoomsAPI = propertyId => roomsAPI.getRoomsByProperty(propertyId);

export const getUtilityContractsAPI = propertyId => contractsAPI.getContractsByProperty(propertyId);

export const getUtilityReadingsAPI = (propertyId, billingMonth) =>
  api.get('/utility-readings', { params: { propertyId, billingMonth } });

export const saveUtilityReadingsAPI = data => api.post('/utility-readings', data);
