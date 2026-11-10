export const validateReportQuery = query => {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
  const { month = today.slice(0, 7), propertyId } = query;
  if (typeof month !== 'string' || !/^(20\d{2})-(0[1-9]|1[0-2])$/.test(month)) {
    throw { status: 400, message: 'Tháng báo cáo phải theo định dạng YYYY-MM (2000–2099).' };
  }
  if (
    propertyId !== undefined &&
    (typeof propertyId !== 'string' || !/^[a-f\d]{24}$/i.test(propertyId))
  ) {
    throw { status: 400, message: 'ID nhà trọ không hợp lệ.' };
  }
  return { month, propertyId: propertyId?.toLowerCase() };
};
