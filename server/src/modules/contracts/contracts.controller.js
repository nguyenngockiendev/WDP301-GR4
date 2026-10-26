import * as contractsService from './contracts.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getContractsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const contracts = await contractsService.getContractsByProperty(propertyId);
    return sendSuccess(res, 200, 'Lấy danh sách hợp đồng thành công', contracts);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getContractById = async (req, res) => {
  try {
    const { contractId } = req.params;
    const contract = await contractsService.getContractById(contractId);
    return sendSuccess(res, 200, 'Lấy thông tin hợp đồng thành công', contract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createContract = async (req, res) => {
  try {
    const newContract = await contractsService.createContract(req.body);
    return sendSuccess(res, 201, 'Tạo hợp đồng thành công', newContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const updatedContract = await contractsService.updateContract(contractId, req.body);
    return sendSuccess(res, 200, 'Cập nhật hợp đồng thành công', updatedContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const renewContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { newEndDate } = req.body;
    const renewedContract = await contractsService.renewContract(contractId, newEndDate);
    return sendSuccess(res, 200, 'Gia hạn hợp đồng thành công', renewedContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const changeRepresentative = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { newRepresentative } = req.body;
    const updatedContract = await contractsService.changeRepresentative(
      contractId,
      newRepresentative,
    );
    return sendSuccess(res, 200, 'Thay đổi người đại diện thành công', updatedContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const searchContracts = async (req, res) => {
  try {
    const filters = req.query;
    const contracts = await contractsService.searchContracts(filters);
    return sendSuccess(res, 200, 'Tìm kiếm hợp đồng thành công', contracts);
  } catch (error) {
    return sendError(res, error);
  }
};
