import app from './app/app.js';
import { connectDatabase } from './config/db.config.js';
import dotenv from 'dotenv';

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
  app.listen(PORT, () => {
    console.log(`[Server] Đang chạy tại :${PORT}`);
  });
}

bootstrap();
