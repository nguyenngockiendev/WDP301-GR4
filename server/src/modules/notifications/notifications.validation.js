export const validateNotificationQuery = query => {
  const { page = '1', limit = '10', status = 'all' } = query;
  const validPage =
    typeof page === 'string' && /^[1-9]\d*$/.test(page) && Number.isSafeInteger(Number(page));
  const validLimit = typeof limit === 'string' && /^[1-9]\d*$/.test(limit) && Number(limit) <= 100;
  if (!validPage || !validLimit || !['all', 'read', 'unread'].includes(status)) {
    throw { status: 400, message: 'Bộ lọc hoặc phân trang không hợp lệ.' };
  }
  return { page: Number(page), limit: Number(limit), status };
};

export const validateNotificationId = id => {
  if (typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) {
    throw { status: 400, message: 'ID thông báo không hợp lệ.' };
  }
};

export const validateSendNotification = body => {
  if (!body || typeof body !== 'object') throw { status: 400, message: 'Dữ liệu không hợp lệ.' };
  const { recipientId, propertyId, propertyIds, title, content, audience = 'individual' } = body;
  if (!['individual', 'property', 'properties'].includes(audience))
    throw { status: 400, message: 'Phạm vi gửi không hợp lệ.' };
  if (audience === 'individual') validateNotificationId(recipientId);
  if (audience === 'properties') {
    if (!Array.isArray(propertyIds) || !propertyIds.length || propertyIds.length > 100)
      throw { status: 400, message: 'Chọn từ 1 đến 100 dãy trọ.' };
    propertyIds.forEach(validateNotificationId);
  } else validateNotificationId(propertyId);
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
    throw { status: 400, message: 'Tiêu đề phải có từ 1 đến 200 ký tự.' };
  }
  if (typeof content !== 'string' || !content.trim() || content.trim().length > 5000) {
    throw { status: 400, message: 'Nội dung phải có từ 1 đến 5000 ký tự.' };
  }
  return {
    audience,
    recipientId: audience === 'individual' ? recipientId.toLowerCase() : undefined,
    propertyId: audience === 'properties' ? undefined : propertyId.toLowerCase(),
    propertyIds:
      audience === 'properties' ? [...new Set(propertyIds.map(id => id.toLowerCase()))] : undefined,
    title: title.trim(),
    content: content.trim(),
  };
};
