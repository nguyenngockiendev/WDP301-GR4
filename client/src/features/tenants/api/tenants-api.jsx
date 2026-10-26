import api from '../../../shared/api/axiosClient';

const tenantsAPI = {
  getTenantsByProperty: async (propertyId) => {
    return api.get(`/tenants/property/${propertyId}`);
  },

  getTenantById: async (tenantId) => {
    return api.get(`/tenants/${tenantId}`);
  },

  searchTenants: async (propertyId, searchTerm) => {
    return api.get(`/tenants/search/${propertyId}`, { params: { q: searchTerm } });
  },
};

export default tenantsAPI;
