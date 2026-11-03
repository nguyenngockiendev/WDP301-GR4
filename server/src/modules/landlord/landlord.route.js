import { Router } from 'express';
import * as controller from './landlord.controller.js';
import { requireAuth, requireRole } from '../../shared/middlewares/auth.middleware.js';

const router = Router();
router.use(requireAuth, requireRole('landlord'));

router.route('/properties').get(controller.listProperties).post(controller.createProperty);
router.put('/properties/:propertyId', controller.updateProperty);
router.patch('/properties/:propertyId/status', controller.setPropertyStatus);
router.get('/properties/:propertyId/rooms', controller.listPropertyRooms);
router.put('/properties/:propertyId/rooms/:roomId/price', controller.setRoomPrice);
router.get('/properties/:propertyId/services', controller.listServices);
router.post('/properties/:propertyId/services', controller.createService);
router.put('/properties/:propertyId/services/:serviceId', controller.updateService);
router.patch('/properties/:propertyId/services/:serviceId/status', controller.setServiceStatus);
router.put('/properties/:propertyId/rates', controller.configureRates);
router.put('/properties/:propertyId/policy', controller.configurePolicy);

router.route('/managers').get(controller.listManagers).post(controller.createManager);
router.put('/managers/:managerId', controller.updateManager);
router.patch('/managers/:managerId/status', controller.setManagerStatus);
router.route('/assignments').get(controller.listAssignments).post(controller.assignManager);
router.delete('/assignments/:assignmentId', controller.removeAssignment);

export default router;
