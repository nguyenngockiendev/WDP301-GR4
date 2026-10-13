import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { UserDAO } from './modules/users/UserDAO.js';
import { ListingDAO } from './modules/rooms/ListingDAO.js';
import { BuildingDAO } from './modules/buildings/BuildingDAO.js';
import { WorkspaceDAO } from './modules/workspace/WorkspaceDAO.js';
import { RentalSettingsDAO } from './modules/rental-settings/RentalSettingsDAO.js';
import { UserService } from './modules/users/UserService.js';
import { ListingService } from './modules/rooms/ListingService.js';
import { BuildingService } from './modules/buildings/BuildingService.js';
import { ReportService } from './modules/reports/ReportService.js';
import { WorkspaceService } from './modules/workspace/WorkspaceService.js';
import { RentalSettingsService } from './modules/rental-settings/RentalSettingsService.js';
import { ContractService } from './modules/contracts/ContractService.js';
import { BillingService } from './modules/billing/BillingService.js';
import { AuthController } from './modules/auth/AuthController.js';
import { UserController } from './modules/users/UserController.js';
import { ListingController } from './modules/rooms/ListingController.js';
import { BuildingController } from './modules/buildings/BuildingController.js';
import { ReportController } from './modules/reports/ReportController.js';
import { WorkspaceController } from './modules/workspace/WorkspaceController.js';
import { RentalSettingsController } from './modules/rental-settings/RentalSettingsController.js';
import { ContractController } from './modules/contracts/ContractController.js';
import { BillingController } from './modules/billing/BillingController.js';
import { BillingDAO } from './modules/billing/BillingDAO.js';
import { USER_ROLES } from './common/constants/roles.js';
import { modules } from './config/modules.js';
import Room from './modules/rooms/Room.js';
import Building from './modules/buildings/Building.js';
import Contract from './modules/contracts/Contract.js';
import RentRate from './modules/rooms/RentRate.js';
import { csrf, requireAuth, roles } from './common/middlewares/security.js';
export function createApp({ mongoUrl, secret, store, production = false }) {
  if (!secret || secret.length < 32)
    throw new Error('SESSION_SECRET requires at least 32 characters.');
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '20kb' }));
  app.use(
    '/api',
    session({
      name: 'boarding.sid',
      secret,
      resave: false,
      saveUninitialized: false,
      store: store ?? MongoStore.create({ mongoUrl }),
      cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 28800000 },
    }),
  );
  const userService = new UserService(new UserDAO());
  const auth = new AuthController(userService);
  const users = new UserController(userService);

  app.use('/api', async (req, res, next) => {
    if (req.session.userId) {
      try {
        req.user = await userService.detail(req.session.userId);
      } catch (error) {
        if (error.status !== 404) throw error;
        delete req.session.userId;
      }
      if (req.user && !USER_ROLES.includes(req.user.role)) {
        delete req.session.userId;
        req.user = null;
      }
    }
    next();
  });
  app.use('/api', csrf);
  app.get('/api/session', (req, res) =>
    res.json({
      user: req.user ?? null,
      csrf: req.session.csrf,
      modules: Object.fromEntries(
        Object.entries(modules).filter(([, m]) => m.roles.includes(req.user?.role)),
      ),
    }),
  );
  const limiter = rateLimit({
    windowMs: 900000,
    limit: 30,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ message: 'Too many attempts. Try again in 15 minutes.' }),
  });
  app.post('/api/auth/register', limiter, auth.register);
  app.post('/api/auth/login', limiter, auth.login);
  app.use('/api', requireAuth);
  app.post('/api/auth/logout', auth.logout);
  app.patch('/api/profile', auth.profile);
  app.get('/api/users', roles('LANDLORD'), users.list);
  app.post('/api/users', roles('LANDLORD'), users.create);
  app.get('/api/users/:id', roles('LANDLORD'), users.detail);
  const buildingDAO = new BuildingDAO(Building, Room, Contract);
  const buildingService = new BuildingService(buildingDAO, new UserDAO());
  const buildings = new BuildingController(buildingService);
  app.get('/api/buildings', roles('LANDLORD'), buildings.list);
  app.post('/api/buildings', roles('LANDLORD'), buildings.create);
  app.get('/api/buildings/:id', roles('LANDLORD'), buildings.detail);
  app.patch('/api/buildings/:id', roles('LANDLORD'), buildings.update);
  app.delete('/api/buildings/:id', roles('LANDLORD'), buildings.remove);
  app.patch('/api/buildings/:id/manager', roles('LANDLORD'), buildings.assignManager);
  app.patch('/api/buildings/:id/status', roles('LANDLORD'), buildings.setStatus);
  const listingService = new ListingService(
    new ListingDAO(Room, RentRate),
    ['LANDLORD', 'MANAGER'],
    new UserDAO(),
    buildingService,
  );
  const rooms = new ListingController(listingService);
  app.use('/api/rooms', roles('LANDLORD', 'MANAGER'));
  app.get('/api/rooms', rooms.list);
  app.post('/api/rooms', roles('LANDLORD'), rooms.create);
  app.post('/api/rooms/bulk', roles('LANDLORD'), rooms.createMany);
  app.get('/api/rooms/:id', rooms.detail);
  app.get('/api/rooms/:id/rent-rates', rooms.rentRates);
  app.patch('/api/rooms/:id/manager', roles('LANDLORD'), rooms.assign);
  app.patch('/api/rooms/:id/building', roles('LANDLORD'), rooms.assignBuilding);
  app.patch('/api/rooms/:id/price', roles('LANDLORD'), rooms.updatePrice);
  const rentalSettings = new RentalSettingsController(
    new RentalSettingsService(new RentalSettingsDAO(), buildingService),
  );
  const contracts = new ContractController(new ContractService());
  app.get('/api/contracts/options', roles('LANDLORD'), contracts.options);
  app.post('/api/contracts', roles('LANDLORD'), contracts.create);
  const billing = new BillingController(new BillingService(new BillingDAO()));
  app.post('/api/billing/readings', roles('LANDLORD', 'MANAGER'), billing.reading);
  app.post('/api/billing/invoices', roles('LANDLORD', 'MANAGER'), billing.invoice);
  app.get('/api/settings/:kind', roles('LANDLORD'), rentalSettings.list);
  app.post('/api/settings/:kind', roles('LANDLORD'), rentalSettings.create);
  app.patch('/api/settings/:kind/:id', roles('LANDLORD'), rentalSettings.update);
  const workspaceDAO = new WorkspaceDAO();
  const workspaceService = new WorkspaceService(workspaceDAO);
  const reportService = new ReportService(workspaceDAO);
  const workspace = new WorkspaceController(workspaceService);
  const reports = new ReportController(reportService);
  app.get('/api/dashboard', workspace.dashboard);
  app.get('/api/reports', roles('LANDLORD'), reports.summary);
  app.get('/api/workspace/:module', workspace.list);
  app.use((req, res) => res.status(404).json({ message: 'Not found.' }));
  app.use((error, req, res, _next) => {
    const status = error.status || 500;
    if (status === 500) console.error(error);
    res.status(status).json({
      message: status === 500 ? 'Something went wrong. Please try again.' : error.message,
    });
  });
  return app;
}
