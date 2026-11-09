import mongoose from 'mongoose';

export function validateManagedInvoiceFilters(_body, _params, query) {
  const { propertyId, billingMonth, sendStatus } = query;
  if (!mongoose.isObjectIdOrHexString(propertyId)) return 'Mã nhà trọ không hợp lệ!';
  if (typeof billingMonth !== 'string' || !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(billingMonth)) {
    return 'Kỳ hóa đơn phải có định dạng YYYY-MM!';
  }
  if (sendStatus !== undefined && !['all', 'unsent', 'sent'].includes(sendStatus)) {
    return 'Trạng thái gửi không hợp lệ!';
  }
  return null;
}

export function validateSendInvoices(body) {
  const invoiceIds = body?.invoiceIds;
  if (!Array.isArray(invoiceIds) || !invoiceIds.length) return 'Vui lòng chọn ít nhất một hóa đơn!';
  if (invoiceIds.some(id => typeof id !== 'string' || !mongoose.isObjectIdOrHexString(id))) {
    return 'Danh sách có mã hóa đơn không hợp lệ!';
  }
  return null;
}
