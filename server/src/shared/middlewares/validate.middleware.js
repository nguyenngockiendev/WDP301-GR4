import { ApiError } from '../utils/ApiError.js';

export function validate(validatorFn) {
  return (req, _res, next) => {
    const errorMessage = validatorFn(req.body, req.params, req.query);
    if (errorMessage) {
      return next(new ApiError(400, errorMessage));
    }
    next();
  };
}
