import { Router } from 'express';
import { register, login } from './auth.controller.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { validateRegister, validateLogin } from './auth.validation.js';

const router = Router();

router.post('/register', validate(validateRegister), register);
router.post('/login', validate(validateLogin), login);

export default router;
