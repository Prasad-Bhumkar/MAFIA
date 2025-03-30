import express from 'express';
import { setupBrowserAutomation } from './browser';
import { setupFileOperations, safeWriteFile } from './fs';
import { setupSecurity, rateLimitMiddleware, authenticateToken } from './security';
import taskRoutes from './api/tasks';

const PORT = process.env.PORT || 3000;
process.env.JWT_SECRET = 'mafia-secret-key'; // TODO: Move to env file

async function initializeMafiaCore() {
  try {
    // Initialize core modules
    await setupSecurity();
    await setupFileOperations();
    await setupBrowserAutomation();

    // Create Express app
    const app = express();
    app.use(express.json());
    app.use(rateLimitMiddleware);

    // Setup routes
    app.use('/api', authenticateToken, taskRoutes);

    // Health check endpoint
    app.get('/', (req, res) => {
      res.status(200).json({ status: 'MAFIA Core is running' });
    });

    // Start server
    app.listen(PORT, () => {
      safeWriteFile('logs/server.log', `Server started on port ${PORT}\n`);
      console.log(`MAFIA Core running on port ${PORT}`);
    });
  } catch (error) {
    safeWriteFile('logs/error.log', `Startup error: ${error}\n`);
    console.error('Failed to initialize MAFIA Core:', error);
    process.exit(1);
  }
}

initializeMafiaCore();
