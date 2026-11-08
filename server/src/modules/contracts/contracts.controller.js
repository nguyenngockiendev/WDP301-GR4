import * as contractsService from './contracts.service.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';

export const getContractsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const contracts = await contractsService.getContractsByProperty(propertyId, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách hợp đồng thành công', contracts);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getContractFormOptions = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const options = await contractsService.getContractFormOptions(propertyId, req.user);
    return sendSuccess(res, 200, 'Lấy dữ liệu tạo hợp đồng thành công', options);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getContractById = async (req, res) => {
  try {
    const { contractId } = req.params;
    const contract = await contractsService.getContractById(contractId, req.user);
    return sendSuccess(res, 200, 'Lấy thông tin hợp đồng thành công', contract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createContract = async (req, res) => {
  try {
    const newContract = await contractsService.createContract(req.body, req.user);
    return sendSuccess(res, 201, 'Tạo hợp đồng thành công', newContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const updateContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const updatedContract = await contractsService.updateContract(contractId, req.body, req.user);
    return sendSuccess(res, 200, 'Cập nhật hợp đồng thành công', updatedContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const renewContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { newEndDate } = req.body;
    const renewedContract = await contractsService.renewContract(contractId, newEndDate, req.user);
    return sendSuccess(res, 200, 'Gia hạn hợp đồng thành công', renewedContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const changeRepresentative = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { newRepresentative } = req.body;
    const updatedContract = await contractsService.changeRepresentative(contractId, newRepresentative, req.user);
    return sendSuccess(res, 200, 'Thay đổi người đại diện thành công', updatedContract);
  } catch (error) {
    return sendError(res, error);
  }
};

export const searchContracts = async (req, res) => {
  try {
    const contracts = await contractsService.searchContracts(req.query, req.user);
    return sendSuccess(res, 200, 'Tìm kiếm hợp đồng thành công', contracts);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getContractDocument = async (req, res) => {
  try {
    const document = await contractsService.getContractDocument(req.params.contractId, req.user);
    return sendSuccess(res, 200, 'Lấy văn bản hợp đồng thành công', document);
  } catch (error) {
    return sendError(res, error);
  }
};
