"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
const vscode = __importStar(require("vscode"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
const AgentPanel_1 = require("../views/AgentPanel");
class AgentOrchestrator {
    constructor(context) {
        this.context = context;
        this.operationQueue = [];
        this.activeOperations = new Set();
        this.initializePanel();
    }
    static init(context) {
        if (!AgentOrchestrator.instance) {
            AgentOrchestrator.instance = new AgentOrchestrator(context);
        }
        return AgentOrchestrator.instance;
    }
    initializePanel() {
        this.context.subscriptions.push(vscode.commands.registerCommand('mafia.showAgentPanel', () => {
            AgentPanel_1.AgentPanel.createOrShow(this.context);
            this.panel = AgentPanel_1.AgentPanel.currentPanel;
        }));
    }
    async executeTask(taskDescription) {
        try {
            const operations = await this.parseTaskToOperations(taskDescription);
            this.enqueueOperations(operations);
            await this.processQueue();
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Task execution failed');
        }
    }
    async parseTaskToOperations(task) {
        // TODO: Implement AI-powered task parsing
        return [{
                id: this.generateId(),
                type: 'command',
                action: 'execute',
                parameters: { command: 'echo "Hello World"' },
                status: 'queued',
                description: task,
                createdAt: new Date()
            }];
    }
    enqueueOperations(operations) {
        this.operationQueue.push(...operations);
        operations.forEach(op => this.updateOperationInUI(op));
    }
    async processQueue() {
        while (this.operationQueue.length > 0) {
            const operation = this.operationQueue.shift();
            await this.executeOperation(operation);
        }
    }
    async executeOperation(operation) {
        try {
            this.activeOperations.add(operation.id);
            operation.status = 'running';
            operation.startedAt = new Date();
            this.updateOperationInUI(operation);
            // Execute based on operation type
            switch (operation.type) {
                case 'file':
                    await this.handleFileOperation(operation);
                    break;
                case 'browser':
                    await this.handleBrowserOperation(operation);
                    break;
                case 'command':
                    await this.handleCommandOperation(operation);
                    break;
            }
            operation.status = 'completed';
            operation.completedAt = new Date();
            this.updateOperationInUI(operation);
        }
        catch (error) {
            operation.status = 'failed';
            this.updateOperationInUI(operation);
            ErrorHandler_1.ErrorHandler.handle(error, 'Operation failed', {
                operationId: operation.id,
                operationType: operation.type
            });
        }
        finally {
            this.activeOperations.delete(operation.id);
        }
    }
    updateOperationInUI(operation) {
        this.panel?.updateOperation({
            id: operation.id,
            type: operation.type,
            status: operation.status.toUpperCase(),
            description: operation.description
        });
    }
    // Operation type handlers
    async handleFileOperation(op) {
        // TODO: Implement file operations
    }
    async handleBrowserOperation(op) {
        // TODO: Implement browser automation
    }
    async handleCommandOperation(op) {
        // TODO: Implement command execution
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
//# sourceMappingURL=AgentOrchestrator.js.map