import * as tenantsService from './tenants.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getTenantsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const tenants = await tenantsService.getTenantsByProperty(propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách người thuê thành công', tenants);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getTenantById = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await tenantsService.getTenantById(tenantId);
    return sendSuccess(res, 200, 'Lấy thông tin người thuê thành công', tenant);
  } catch (error) {
    return sendError(res, error);
  }
};

export const searchTenants = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { q } = req.query;
    const tenants = await tenantsService.searchTenants(propertyId, q);
    return sendSuccess(res, 200, 'Tìm kiếm người thuê thành công', tenants);
  } catch (error) {
    return sendError(res, error);
  }
};
