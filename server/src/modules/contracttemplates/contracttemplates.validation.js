import { findUnknownPlaceholders } from './contracttemplates.placeholders.js';

const STATUSES = ['active', 'inactive'];

const checkContent = content => {
  if (String(content).length > 50000) return 'Nội dung mẫu tối đa 50.000 ký tự';
  const unknown = findUnknownPlaceholders(content);
  if (unknown.length) return `Biến không hợp lệ trong mẫu: ${unknown.map(k => `{{${k}}}`).join(', ')}`;
  return null;
};

export function validateCreateTemplate(body) {
  if (!body?.title || String(body.title).trim().length === 0) {
    return 'Tên mẫu hợp đồng không được để trống';
  }
  if (String(body.title).trim().length > 200) {
    return 'Tên mẫu tối đa 200 ký tự';
  }
  if (!body?.content || String(body.content).trim().length === 0) {
    return 'Nội dung mẫu hợp đồng không được để trống';
  }
  if (body.status && !STATUSES.includes(body.status)) {
    return 'Trạng thái không hợp lệ';
  }
  return checkContent(body.content);
}

export function validateUpdateTemplate(body) {
  if (body?.title !== undefined && String(body.title).trim().length === 0) {
    return 'Tên mẫu hợp đồng không được để trống';
  }
  if (body?.title !== undefined && String(body.title).trim().length > 200) {
    return 'Tên mẫu tối đa 200 ký tự';
  }
  if (body?.content !== undefined) {
    if (String(body.content).trim().length === 0) return 'Nội dung mẫu hợp đồng không được để trống';
    const err = checkContent(body.content);
    if (err) return err;
  }
  if (body?.status !== undefined && !STATUSES.includes(body.status)) {
    return 'Trạng thái không hợp lệ';
  }
  return null;
}

export function validateTemplateStatus(body) {
  if (!body?.status || !STATUSES.includes(body.status)) {
    return 'Trạng thái không hợp lệ';
  }
  return null;
}
