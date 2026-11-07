import { listAssignedProperties } from './manager.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export async function getAssignedProperties(req, res) {
  const properties = await listAssignedProperties(req.user.userId);
  return sendSuccess(res, 200, 'Nhà trọ được phân công.', properties);
}
