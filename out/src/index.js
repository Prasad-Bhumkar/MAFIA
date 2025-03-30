"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const browser_1 = require("./browser");
const fs_1 = require("./fs");
const security_1 = require("./security");
const tasks_1 = __importDefault(require("./api/tasks"));
const PORT = process.env.PORT || 3000;
process.env.JWT_SECRET = 'mafia-secret-key'; // TODO: Move to env file
async function initializeMafiaCore() {
    try {
        // Initialize core modules
        await (0, security_1.setupSecurity)();
        await (0, fs_1.setupFileOperations)();
        await (0, browser_1.setupBrowserAutomation)();
        // Create Express app
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        app.use(security_1.rateLimitMiddleware);
        // Setup routes
        app.use('/api', security_1.authenticateToken, tasks_1.default);
        // Health check endpoint
        app.get('/', (req, res) => {
            res.status(200).json({ status: 'MAFIA Core is running' });
        });
        // Start server
        app.listen(PORT, () => {
            (0, fs_1.safeWriteFile)('logs/server.log', `Server started on port ${PORT}\n`);
            console.log(`MAFIA Core running on port ${PORT}`);
        });
    }
    catch (error) {
        (0, fs_1.safeWriteFile)('logs/error.log', `Startup error: ${error}\n`);
        console.error('Failed to initialize MAFIA Core:', error);
        process.exit(1);
    }
}
initializeMafiaCore();
//# sourceMappingURL=index.js.map