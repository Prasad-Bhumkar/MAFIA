import * as vscode from 'vscode';

export interface OperationContext {
    operationId: string;
    operationType: 'file' | 'browser' | 'command';
    retryCount?: number;
    rollback?: () => Promise<void>;
}

// Custom error classes
export class APIKeyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'APIKeyError';
    }
}

export class ModelError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ModelError';
    }
}

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class LocalModelError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LocalModelError';
    }
}

export class ErrorHandler {
    private static outputChannel: vscode.OutputChannel;
    private static operationLogs: Map<string, string[]> = new Map();

    public static initialize() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('MAFIA AI Errors');
        }
    }

    public static handle(
        error: unknown, 
        context: string = '', 
        operation?: OperationContext
    ): void {
        this.initialize();
        
        let message = 'An error occurred';
        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        const fullMessage = `[${new Date().toISOString()}] ${context}: ${message}`;
        
        // Enhanced operation tracking
        if (operation) {
            const opLog = this.operationLogs.get(operation.operationId) || [];
            opLog.push(fullMessage);
            this.operationLogs.set(operation.operationId, opLog);

            // Automatic retry logic
            if (operation.retryCount && operation.retryCount > 0) {
                vscode.window.showWarningMessage(
                    `[MAFIA AI] Retrying operation (${operation.retryCount} attempts left)...`,
                    'Cancel'
                ).then(selection => {
                    if (selection === 'Cancel') {
                        operation.rollback?.();
                    }
                });
                return;
            }

            // Rollback if available
            if (operation.rollback) {
                vscode.window.showErrorMessage(
                    `[MAFIA AI] Operation failed - attempting rollback`,
                    'View Details'
                ).then(selection => {
                    if (selection === 'View Details') {
                        this.showOperationLog(operation.operationId);
                    }
                });
                operation.rollback();
            } else {
                vscode.window.showErrorMessage(
                    `[MAFIA AI] ${context}: ${message}`,
                    'View Details'
                ).then(selection => {
                    if (selection === 'View Details') {
                        this.showOperationLog(operation.operationId);
                    }
                });
            }
        } else {
            // Original behavior for non-operation errors
            vscode.window.showErrorMessage(`[MAFIA AI] ${context}: ${message}`);
        }
        
        // Log detailed error
        this.outputChannel.appendLine(fullMessage);
        if (error instanceof Error && error.stack) {
            this.outputChannel.appendLine(error.stack);
        }
        this.outputChannel.show(true);
    }

    public static log(message: string, context: string = '', operationId?: string) {
        this.initialize();
        const fullMessage = `[${new Date().toISOString()}] ${context}: ${message}`;
        
        if (operationId) {
            const opLog = this.operationLogs.get(operationId) || [];
            opLog.push(fullMessage);
            this.operationLogs.set(operationId, opLog);
        }
        
        this.outputChannel.appendLine(fullMessage);
    }

    private static showOperationLog(operationId: string) {
        const logs = this.operationLogs.get(operationId) || [];
        const panel = vscode.window.createWebviewPanel(
            'operationLog',
            `Operation ${operationId} Log`,
            vscode.ViewColumn.Two,
            {}
        );
        panel.webview.html = `<!DOCTYPE html>
            <html>
            <head><title>Operation Log</title></head>
            <body>
                <h1>Operation ${operationId} Log</h1>
                <pre>${logs.join('\n')}</pre>
            </body>
            </html>`;
    }
}