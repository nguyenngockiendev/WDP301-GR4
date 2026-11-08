import { Router } from 'express';

import authRoutes from '../modules/auth/auth.route.js';
import roomsRoutes from '../modules/rooms/rooms.route.js';
import contractsRoutes from '../modules/contracts/contracts.route.js';
import rentalRequestsRoutes from '../modules/rentalrequests/rentalrequests.route.js';
import tenantsRoutes from '../modules/tenants/tenants.route.js';
import landlordRoutes from '../modules/landlord/landlord.route.js';
import managerRoutes from '../modules/manager/manager.route.js';
import propertyOperationsRoutes from '../modules/property-operations/property-operations.route.js';
import notificationsRoutes from '../modules/notifications/notifications.route.js';
import propertiesRoutes from '../modules/properties/properties.route.js';
import terminationRequestsRoutes from '../modules/terminationrequests/terminationrequests.route.js';
import contractTemplatesRoutes from '../modules/contracttemplates/contracttemplates.route.js';
import managerAssignmentsRoutes from '../modules/managerassignments/managerassignments.route.js';
import utilityReadingsRoutes from '../modules/utility-readings/utility-readings.route.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/landlord', landlordRoutes);
router.use('/manager', managerRoutes);
router.use('/rooms', roomsRoutes);
router.use('/contracts', contractsRoutes);
router.use('/rental-requests', rentalRequestsRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/operations', propertyOperationsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/properties', propertiesRoutes);
router.use('/termination-requests', terminationRequestsRoutes);
router.use('/contract-templates', contractTemplatesRoutes);
router.use('/manager-assignments', managerAssignmentsRoutes);
router.use('/utility-readings', utilityReadingsRoutes);

export default router;
