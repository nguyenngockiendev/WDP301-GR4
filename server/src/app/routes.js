import { Router } from 'express';
import authRoutes from '../modules/auth/auth.route.js';

const router = Router();


router.use('/auth', authRoutes);

export default router;
