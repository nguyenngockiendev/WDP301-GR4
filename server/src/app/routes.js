
import { Router } from 'express';

import authRoutes from '../modules/auth/auth.route.js';
import roomsRoutes from '../modules/rooms/rooms.route.js';
import contractsRoutes from '../modules/contracts/contracts.route.js';
import rentalRequestsRoutes from '../modules/rentalrequests/rentalrequests.route.js';
import tenantsRoutes from '../modules/tenants/tenants.route.js';
import terminationRoutes from '../modules/terminationrequests/terminationrequests.route.js';
import notificationsRoutes from '../modules/notifications/notifications.route.js';
import propertiesRoutes from '../modules/properties/properties.route.js';
import terminationRequestsRoutes from '../modules/terminationrequests/terminationrequests.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rooms', roomsRoutes);
router.use('/contracts', contractsRoutes);
router.use('/rental-requests', rentalRequestsRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/termination-requests', terminationRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/properties', propertiesRoutes);
router.use('/termination-requests', terminationRequestsRoutes);
export default router;
