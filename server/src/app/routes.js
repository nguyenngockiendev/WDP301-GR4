import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { UserDAO } from '../modules/users/users.dao.js';
import { ListingDAO } from '../modules/rooms/rooms.dao.js';
import { BuildingDAO } from '../modules/buildings/buildings.dao.js';
import { WorkspaceDAO } from '../modules/workspace/workspace.dao.js';
import { RentalSettingsDAO } from '../modules/settings/settings.dao.js';
import { BillingDAO } from '../modules/billing/billing.dao.js';
import { UserService } from '../modules/users/users.service.js';
import { ListingService } from '../modules/rooms/rooms.service.js';
import { BuildingService } from '../modules/buildings/buildings.service.js';
import { ReportService } from '../modules/reports/reports.service.js';
import { WorkspaceService } from '../modules/workspace/workspace.service.js';
import { RentalSettingsService } from '../modules/settings/settings.service.js';
import { ContractService } from '../modules/contracts/contracts.service.js';
import { BillingService } from '../modules/billing/billing.service.js';
import { AuthController } from '../modules/auth/auth.controller.js';
import { UserController } from '../modules/users/users.controller.js';
import { ListingController } from '../modules/rooms/rooms.controller.js';
import { BuildingController } from '../modules/buildings/buildings.controller.js';
import { ReportController } from '../modules/reports/reports.controller.js';
import { WorkspaceController } from '../modules/workspace/workspace.controller.js';
import { RentalSettingsController } from '../modules/settings/settings.controller.js';
import { ContractController } from '../modules/contracts/contracts.controller.js';
import { BillingController } from '../modules/billing/billing.controller.js';
import { USER_ROLES } from '../shared/constants/roles.js';
import { modules } from '../config/modules.js';
import Room from '../models/Rooms.js';
import Building from '../models/Building.js';
import Contract from '../models/Contracts.js';
import RentRate from '../models/RentRate.js';
import { csrf, requireAuth } from '../shared/middlewares/security.js';
import authRoutes from '../modules/auth/auth.route.js';
import userRoutes from '../modules/users/users.route.js';
import roomRoutes from '../modules/rooms/rooms.route.js';
import buildingRoutes from '../modules/buildings/buildings.route.js';
import contractRoutes from '../modules/contracts/contracts.route.js';
import billingRoutes from '../modules/billing/billing.route.js';
import settingsRoutes from '../modules/settings/settings.route.js';
import reportRoutes from '../modules/reports/reports.route.js';
import workspaceRoutes from '../modules/workspace/workspace.route.js';
import notificationRoutes from '../modules/notifications/notifications.route.js';

export function createApiRouter() {
  const router = express.Router();
  const userService = new UserService(new UserDAO());

  router.use(async (req, res, next) => {
    if (!req.session.userId) return next();
    try {
      req.user = await userService.detail(req.session.userId);
    } catch (error) {
      if (error.status !== 404) return next(error);
      delete req.session.userId;
    }
    if (req.user && !USER_ROLES.includes(req.user.role)) {
      delete req.session.userId;
      req.user = null;
    }
    next();
  });
  router.use(csrf);
  router.get('/session', (req, res) =>
    res.json({
      user: req.user ?? null,
      csrf: req.session.csrf,
      modules: Object.fromEntries(
        Object.entries(modules).filter(([, item]) => item.roles.includes(req.user?.role)),
      ),
    }),
  );

  const limiter = rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({ message: 'Too many attempts. Try again later.' }),
  });
  const auth = new AuthController(userService);
  router.use('/auth', authRoutes(auth, limiter));
  router.use(requireAuth);
  router.patch('/profile', auth.profile);

  const users = new UserController(userService);
  router.use('/users', userRoutes(users));
  router.use('/notifications', notificationRoutes());

  const buildingService = new BuildingService(
    new BuildingDAO(Building, Room, Contract),
    new UserDAO(),
  );
  router.use('/buildings', buildingRoutes(new BuildingController(buildingService)));

  const roomController = new ListingController(
    new ListingService(
      new ListingDAO(Room, RentRate),
      ['LANDLORD', 'MANAGER'],
      new UserDAO(),
      buildingService,
    ),
  );
  router.use('/rooms', roomRoutes(roomController));

  router.use('/contracts', contractRoutes(new ContractController(new ContractService())));
  router.use(
    '/billing',
    billingRoutes(new BillingController(new BillingService(new BillingDAO()))),
  );
  router.use(
    '/settings',
    settingsRoutes(
      new RentalSettingsController(
        new RentalSettingsService(new RentalSettingsDAO(), buildingService),
      ),
    ),
  );

  const workspaceDAO = new WorkspaceDAO();
  router.use('/', workspaceRoutes(new WorkspaceController(new WorkspaceService(workspaceDAO))));
  router.use('/reports', reportRoutes(new ReportController(new ReportService(workspaceDAO))));
  return router;
}
