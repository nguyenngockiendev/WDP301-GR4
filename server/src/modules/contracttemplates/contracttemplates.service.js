import mongoose from 'mongoose';
import ContractTemplates from '../../models/ContractTemplates.js';
import Properties from '../../models/Properties.js';
import { assertPropertyAccess, getMyProperties } from '../properties/properties.service.js';
import { TEMPLATE_PLACEHOLDERS } from './contracttemplates.placeholders.js';

/** Danh sách chủ trọ (owner) mà user được dùng mẫu hợp đồng của họ. */
const getAllowedOwnerIds = async user => {
  if (user.role === 'landlord') return [String(user.userId)];
  const properties = await getMyProperties(user);
  return [...new Set(properties.map(p => String(p.owner)))];
};

/**
 * Landlord: các mẫu do mình tạo (mọi trạng thái).
 * Manager: các mẫu đang dùng của chủ trọ sở hữu nhà trọ mình được giao.
 * Có thể lọc theo nhà trọ (?property=) -> chỉ mẫu của chủ nhà trọ đó.
 */
export const getTemplates = async (user, filters = {}) => {
  let ownerIds = await getAllowedOwnerIds(user);

  if (filters.property) {
    await assertPropertyAccess(user, filters.property);
    const property = await Properties.findById(filters.property).select('owner');
    ownerIds = ownerIds.filter(id => id === String(property?.owner));
  }

  const query = { createdBy: { $in: ownerIds } };
  if (user.role !== 'landlord') {
    query.status = 'active';
  } else if (filters.status) {
    query.status = filters.status;
  }

  const kw = String(filters.q || '').trim();
  if (kw) query.title = { $regex: kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

  return ContractTemplates.find(query).sort({ updatedAt: -1 }).populate('createdBy', 'fullName email');
};

/** Lấy mẫu và kiểm tra quyền xem (landlord: mẫu của mình; manager: mẫu active của chủ trọ được giao). */
export const getTemplateById = async (templateId, user) => {
  if (!mongoose.isValidObjectId(templateId)) {
    throw { status: 404, message: 'Mẫu hợp đồng không tồn tại' };
  }
  const template = await ContractTemplates.findById(templateId).populate('createdBy', 'fullName email');
  if (!template) {
    throw { status: 404, message: 'Mẫu hợp đồng không tồn tại' };
  }

  const ownerIds = await getAllowedOwnerIds(user);
  const ownerId = String(template.createdBy?._id || template.createdBy);
  if (!ownerIds.includes(ownerId) || (user.role !== 'landlord' && template.status !== 'active')) {
    throw { status: 403, message: 'Bạn không có quyền xem mẫu hợp đồng này!' };
  }
  return template;
};

/** Chỉ chủ trọ tạo ra mẫu mới được sửa / đổi trạng thái. */
const findOwnTemplate = async (templateId, user) => {
  if (!mongoose.isValidObjectId(templateId)) {
    throw { status: 404, message: 'Mẫu hợp đồng không tồn tại' };
  }
  const template = await ContractTemplates.findById(templateId);
  if (!template) {
    throw { status: 404, message: 'Mẫu hợp đồng không tồn tại' };
  }
  if (String(template.createdBy) !== String(user.userId)) {
    throw { status: 403, message: 'Bạn chỉ được sửa mẫu hợp đồng do mình tạo!' };
  }
  return template;
};

export const createTemplate = async (data, user) => {
  const template = await ContractTemplates.create({
    title: String(data.title).trim(),
    content: data.content,
    status: data.status || 'active',
    createdBy: user.userId,
  });
  return template.populate('createdBy', 'fullName email');
};

export const updateTemplate = async (templateId, data, user) => {
  const template = await findOwnTemplate(templateId, user);
  if (data.title !== undefined) template.title = String(data.title).trim();
  if (data.content !== undefined) template.content = data.content;
  if (data.status !== undefined) template.status = data.status;
  await template.save();
  return template.populate('createdBy', 'fullName email');
};

export const updateTemplateStatus = async (templateId, status, user) => {
  const template = await findOwnTemplate(templateId, user);
  template.status = status;
  await template.save();
  return template.populate('createdBy', 'fullName email');
};

export const getPlaceholders = () => TEMPLATE_PLACEHOLDERS;
