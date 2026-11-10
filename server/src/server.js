import app from './app/app.js';
import { connectDatabase } from './config/db.config.js';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { attachNotificationsSocket } from './modules/notifications/notifications.socket.js';
import { allowedOrigins } from './config/origins.config.js';
import { startNotificationJobs } from './modules/notifications/notifications-jobs.service.js';

// Import all models to register schemas
import './models/Users.js';
import './models/Properties.js';
import './models/Rooms.js';
import './models/RentalRequests.js';
import './models/Contracts.js';
import './models/Invoices.js';
import './models/Services.js';
import './models/ContractTemplates.js';
import './models/UtilityReadings.js';
import './models/Payments.js';
import './models/TerminationRequests.js';
import './models/ManagerAssignments.js';
import './models/Notifications.js';
import './models/Otps.js';
import './models/PropertyServices.js';

const PORT = process.env.PORT || 9999;
dotenv.config();

async function bootstrap() {
  await connectDatabase();
  // Bật tại môi trường triển khai sau khi nhóm chốt lịch nhắc.
  if (process.env.NOTIFICATION_JOBS_ENABLED === 'true') startNotificationJobs();
  const server = createServer(app);
  attachNotificationsSocket(server, { allowedOrigins });
  server.listen(PORT, () => {
    console.log(`[Server] Đang chạy tại :${PORT}`);
  });
}

bootstrap();
