import * as vscode from 'vscode';

export class ErrorHandler {
    private static outputChannel: vscode.OutputChannel;

    public static initialize() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('IndiCab AI Errors');
        }
    }

    public static handle(error: unknown, context: string = ''): void {
        this.initialize();
        
        let message = 'An error occurred';
        if (error instanceof Error) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        }

        const fullMessage = `[${new Date().toISOString()}] ${context}: ${message}`;
        
        // Show user-friendly message
        vscode.window.showErrorMessage(`[IndiCab AI] ${context}: ${message}`);
        
        // Log detailed error to output channel
        this.outputChannel.appendLine(fullMessage);
        
        if (error instanceof Error && error.stack) {
            this.outputChannel.appendLine(error.stack);
        }
        
        this.outputChannel.show(true);
    }

    public static log(message: string, context: string = '') {
        this.initialize();
        const fullMessage = `[${new Date().toISOString()}] ${context}: ${message}`;
        this.outputChannel.appendLine(fullMessage);
    }
}