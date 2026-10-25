export const sendSuccess = (res, status = 200, message = 'Thành công!', data = null) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, error) => {
  console.log(error);
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Lỗi máy chủ nội bộ!',
  });
};
