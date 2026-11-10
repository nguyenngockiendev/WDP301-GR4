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
