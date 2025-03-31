import * as vscode from 'vscode';
import { AIServiceV2 } from './AIServiceV2';
import ErrorHandler from '../utils/ErrorHandler';
import { AgentPanel } from '../views/AgentPanel';
import { CommandExecutor } from './CommandExecutor';
import { Logger } from '../utils/Logger';
import { BrowserService } from './BrowserService';

export interface AgentOperation {
    id: string;
    type: 'file' | 'browser' | 'command';
    action: string;
    parameters: any;
    status: 'queued' | 'running' | 'completed' | 'failed';
    description: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}

export class AgentOrchestrator {
    private static instance: AgentOrchestrator;
    private operationQueue: AgentOperation[] = [];
    private activeOperations: Set<string> = new Set();
    private panel?: AgentPanel;

    private constructor(private context: vscode.ExtensionContext) {
        this.initializePanel();
    }

    public static init(context: vscode.ExtensionContext): AgentOrchestrator {
        if (!AgentOrchestrator.instance) {
            AgentOrchestrator.instance = new AgentOrchestrator(context);
        }
        return AgentOrchestrator.instance;
    }

    private initializePanel() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('mafia.showAgentPanel', () => {
                AgentPanel.createOrShow(this.context);
                this.panel = AgentPanel.currentPanel;
            })
        );
    }

    public async executeTask(taskDescription: string): Promise<void> {
        try {
            const operations = await this.parseTaskToOperations(taskDescription);
            this.enqueueOperations(operations);
            await this.processQueue();
        } catch (error) {
            ErrorHandler.handle(error, 'Task execution failed');
        }
    }

    private async parseTaskToOperations(task: string): Promise<AgentOperation[]> {
        try {
            const aiService = AIServiceV2.getInstance(this.context);
            const generatedCode = await aiService.generateCode(
                `Convert this task to operations: ${task}`,
                'typescript'
            );

            // Parse the generated code into operations
            const operations: AgentOperation[] = [];
            
            // Simple parsing logic - in a real implementation this would be more robust
            if (generatedCode.includes('file')) {
                operations.push({
                    id: this.generateId(),
                    type: 'file',
                    action: 'edit',
                    parameters: { path: 'path/to/file', content: '// Generated content' },
                    status: 'queued',
                    description: `File operation for: ${task}`,
                    createdAt: new Date()
                });
            }

            if (generatedCode.includes('browser')) {
                operations.push({
                    id: this.generateId(),
                    type: 'browser',
                    action: 'navigate',
                    parameters: { url: 'https://example.com' },
                    status: 'queued',
                    description: `Browser operation for: ${task}`,
                    createdAt: new Date()
                });
            }

            if (operations.length === 0) {
                // Default fallback to command operation
                operations.push({
                    id: this.generateId(),
                    type: 'command',
                    action: 'execute',
                    parameters: { command: `echo "Processing: ${task}"` },
                    status: 'queued',
                    description: task,
                    createdAt: new Date()
                });
            }

            return operations;
        } catch (error) {
            ErrorHandler.handle(error, 'Failed to parse task');
            return [{
                id: this.generateId(),
                type: 'command',
                action: 'execute',
                parameters: { command: `echo "Fallback for: ${task}"` },
                status: 'queued',
                description: task,
                createdAt: new Date()
            }];
        }
    }

    private enqueueOperations(operations: AgentOperation[]) {
        this.operationQueue.push(...operations);
        operations.forEach(op => this.updateOperationInUI(op));
    }

    private async processQueue(): Promise<void> {
        while (this.operationQueue.length > 0) {
            const operation = this.operationQueue.shift()!;
            await this.executeOperation(operation);
        }
    }

    private async executeOperation(operation: AgentOperation): Promise<void> {
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
        } catch (error) {
            operation.status = 'failed';
            this.updateOperationInUI(operation);
            ErrorHandler.handle(error, 'Operation failed', {
                operationId: operation.id,
                operationType: operation.type
            });
        } finally {
            this.activeOperations.delete(operation.id);
        }
    }

    private updateOperationInUI(operation: AgentOperation) {
        this.panel?.updateOperation({
            id: operation.id,
            type: operation.type,
            status: operation.status.toUpperCase() as 'RUNNING' | 'COMPLETED' | 'FAILED',
            description: operation.description
        });
    }

    // Operation type handlers
    private async handleFileOperation(op: AgentOperation): Promise<void> {
        try {
            const { path, content } = op.parameters;
            if (!path || !content) {
                throw new Error('Missing required file operation parameters');
            }

            // Get the full file system path
            const fullPath = vscode.Uri.file(
                path.startsWith('/') ? path : `${this.context.extensionPath}/${path}`
            );

            // Write the file content
            await vscode.workspace.fs.writeFile(
                fullPath,
                Buffer.from(content)
            );

            Logger.info(`File operation completed: ${op.description}`);
        } catch (error) {
            Logger.error(`File operation failed: ${op.description}`, error);
            throw error;
        }
    }

    private async handleBrowserOperation(op: AgentOperation): Promise<void> {
        try {
            const browserService = BrowserService.getInstance(this.context);
            await browserService.launchBrowser();

            switch(op.action) {
                case 'navigate':
                    await browserService.navigate(op.parameters.url);
                    break;
                case 'click':
                    await browserService.executeScript(
                        `document.querySelector('${op.parameters.selector}').click()`
                    );
                    break;
                case 'type':
                    await browserService.executeScript(
                        `document.querySelector('${op.parameters.selector}').value = '${op.parameters.text}'`
                    );
                    break;
                case 'screenshot':
                    await browserService.captureScreenshot();
                    break;
                default:
                    throw new Error(`Unsupported browser action: ${op.action}`);
            }

            Logger.info(`Browser operation completed: ${op.description}`);
        } catch (error) {
            Logger.error(`Browser operation failed: ${op.description}`, error);
            throw error;
        }
    }

    private async handleCommandOperation(op: AgentOperation): Promise<void> {
        const commandExecutor = CommandExecutor.getInstance(this.context);
        await commandExecutor.execute(op);
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}