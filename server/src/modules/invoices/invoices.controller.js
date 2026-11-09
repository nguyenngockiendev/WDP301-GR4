import { sendError, sendSuccess } from '../../shared/utils/response.js';
import * as invoicesService from './invoices.service.js';

export const getManagedInvoices = async (req, res) => {
  try {
    const { propertyId, billingMonth, sendStatus } = req.query;
    const result = await invoicesService.getManagedInvoices({ propertyId, billingMonth, sendStatus }, req.user);
    return sendSuccess(res, 200, 'Lấy danh sách hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getManagedInvoice = async (req, res) => {
  try {
    const result = await invoicesService.getManagedInvoice(req.params.invoiceId, req.user);
    return sendSuccess(res, 200, 'Lấy chi tiết hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const sendInvoices = async (req, res) => {
  try {
    const result = await invoicesService.sendInvoices(req.body.invoiceIds, req.user);
    const message = result.sentCount
      ? `Đã gửi ${result.sentCount} hóa đơn cho người thuê!`
      : 'Các hóa đơn đã được gửi trước đó.';
    return sendSuccess(res, 200, message, result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getMyInvoices = async (req, res) => {
  try {
    const result = await invoicesService.getMyInvoices(req.user.userId);
    return sendSuccess(res, 200, 'Lấy danh sách hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const getMyInvoice = async (req, res) => {
  try {
    const result = await invoicesService.getMyInvoice(req.params.invoiceId, req.user.userId);
    return sendSuccess(res, 200, 'Lấy chi tiết hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const previewInvoice = async (req, res) => {
  try {
    const data = {
      contractId: req.body?.contractId,
      billingMonth: req.body?.billingMonth,
    };
    const result = await invoicesService.previewInvoice(data, req.user);
    return sendSuccess(res, 200, 'Xem trước hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};

export const createInvoice = async (req, res) => {
  try {
    const data = {
      contractId: req.body?.contractId,
      billingMonth: req.body?.billingMonth,
      expectedTotalAmount: req.body?.expectedTotalAmount,
    };
    const result = await invoicesService.createInvoice(data, req.user);
    return sendSuccess(res, 201, 'Tạo hóa đơn thành công!', result);
  } catch (error) {
    return sendError(res, error);
  }
};
