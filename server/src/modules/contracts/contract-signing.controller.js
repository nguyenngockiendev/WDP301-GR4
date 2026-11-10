import { sendError, sendSuccess } from '../../shared/utils/response.js';
import * as signing from './contract-signing.service.js';

export async function listMyContracts(req, res) {
  try {
    const contracts = await signing.listTenantSigningContracts(req.user.userId);
    return sendSuccess(res, 200, 'Đã lấy hợp đồng của bạn.', contracts);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function getDocument(req, res) {
  res.set('Cache-Control', 'no-store');
  try {
    const document = await signing.getSigningDocument(req.params.contractId, req.user);
    return sendSuccess(res, 200, 'Đã lấy hợp đồng ký.', document);
  } catch (error) {
    return sendError(res, error);
  }
}

export async function changeSigning(req, res) {
  const { contractId, action } = req.params;
  if (!['send', 'tenant-sign', 'reject', 'manager-sign', 'withdraw'].includes(action)) {
    return sendError(res, { status: 404, message: 'Thao tác ký không tồn tại.' });
  }
  try {
    await signing.changeSigning(contractId, action, req.body || {}, req.user);
    return sendSuccess(res, 200, 'Đã cập nhật trạng thái ký hợp đồng.');
  } catch (error) {
    return sendError(res, error);
  }
}
