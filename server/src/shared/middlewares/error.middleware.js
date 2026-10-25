import { sendError } from '../utils/response.js';

export const notFoundMiddleware = (req, res, _next) => {
  return sendError(res, {
    status: 404,
    message: `Không tìm thấy đường dẫn ${req.originalUrl}`,
  });
};

export const errorMiddleware = (err, _req, res, _next) => {
  return sendError(res, err);
};
