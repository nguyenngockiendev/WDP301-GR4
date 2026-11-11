export const validateDashboardQuery = query => {
  const { propertyId, days = '30' } = query;
  if (
    propertyId !== undefined &&
    (typeof propertyId !== 'string' || !/^[a-f\d]{24}$/i.test(propertyId))
  ) {
    throw { status: 400, message: 'ID nhà trọ không hợp lệ.' };
  }
  if (typeof days !== 'string' || !/^[1-9]\d*$/.test(days) || Number(days) > 365) {
    throw { status: 400, message: 'Khoảng ngày phải từ 1 đến 365.' };
  }
  return { propertyId, days: Number(days) };
};
