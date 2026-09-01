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

// Daily Background Job Scheduler for ML Pipeline & AI Narratives
function scheduleDailyJobs() {
  const runJobs = async () => {
    console.log('[Scheduler] Running daily ML prediction and AI narrative background jobs...');
    try {
      const { exec } = require('child_process');
      const serverDir = path.join(__dirname, '..');
      
      exec(`python "${path.join(serverDir, 'src/scripts/ml_pipeline.py')}"`, (err: any, stdout: string) => {
        if (err) console.error('[Scheduler] ML pipeline error:', err.message);
        else console.log('[Scheduler] ML pipeline completed successfully.');
      });

      exec(`npx ts-node "${path.join(serverDir, 'src/scripts/ai_narrative_worker.ts')}"`, (err: any, stdout: string) => {
        if (err) console.error('[Scheduler] AI Narrative worker error:', err.message);
        else console.log('[Scheduler] AI Narrative worker completed successfully.');
      });
    } catch (e: any) {
      console.error('[Scheduler] Failed to execute background jobs:', e.message);
    }
  };

  setTimeout(runJobs, 30000);
  setInterval(runJobs, 24 * 60 * 60 * 1000);
}

// Start the server
async function startServer() {
  console.log('[Server] Connecting to database...');
  const dbConnected = await checkConnection();
  
  if (dbConnected) {
    console.log('[Server] Database connected successfully.');
    console.log('[Server] Connecting to Redis...');
    await connectRedis();
    scheduleDailyJobs();
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
