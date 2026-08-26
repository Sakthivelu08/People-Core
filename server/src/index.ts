import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { checkConnection } from './config/db';
import { connectRedis } from './config/redis';
import { errorHandler } from './middlewares/error';
import employeeRouter from './routes/employee.routes';
import leaveRouter from './routes/leave.routes';
import onboardingRouter from './routes/onboarding.routes';
import insightRouter from './routes/insight.routes';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

// Standard Middlewares
app.use(cors());
app.use(express.json());

// API Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbConnected = await checkConnection();
  if (dbConnected) {
    res.json({ status: 'OK', message: 'PeopleCore Backend is healthy.', database: 'Connected' });
  } else {
    res.status(503).json({ status: 'ERROR', message: 'PeopleCore Backend is unhealthy.', database: 'Disconnected' });
  }
});

// Mounting Feature Routes
app.use('/api/employees', employeeRouter);
app.use('/api/leaves', leaveRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/insights', insightRouter);

// Global Error Handler (must be registered last)
app.use(errorHandler);

// Start the server
async function startServer() {
  console.log('[Server] Connecting to database...');
  const dbConnected = await checkConnection();
  
  if (dbConnected) {
    console.log('[Server] Database connected successfully.');
    console.log('[Server] Connecting to Redis...');
    await connectRedis();
  } else {
    console.error('[Server] CRITICAL: Database connection failed. Booting down...');
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`[Server] PeopleCore Backend is running on http://localhost:${port}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Active token verification: ${process.env.VALIDATE_AZURE_TOKEN === 'true' ? 'ENABLED' : 'DISABLED (Mock/Header mode)'}`);
  });
}

startServer();
