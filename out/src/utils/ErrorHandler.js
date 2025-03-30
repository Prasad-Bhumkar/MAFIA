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
exports.ErrorHandler = void 0;
const vscode = __importStar(require("vscode"));
class ErrorHandler {
    static initialize() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('MAFIA AI Errors');
        }
    }
    static handle(error, context = '', operation) {
        this.initialize();
        let message = 'An error occurred';
        if (error instanceof Error) {
            message = error.message;
        }
        else if (typeof error === 'string') {
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
                vscode.window.showWarningMessage(`[MAFIA AI] Retrying operation (${operation.retryCount} attempts left)...`, 'Cancel').then(selection => {
                    if (selection === 'Cancel') {
                        operation.rollback?.();
                    }
                });
                return;
            }
            // Rollback if available
            if (operation.rollback) {
                vscode.window.showErrorMessage(`[MAFIA AI] Operation failed - attempting rollback`, 'View Details').then(selection => {
                    if (selection === 'View Details') {
                        this.showOperationLog(operation.operationId);
                    }
                });
                operation.rollback();
            }
            else {
                vscode.window.showErrorMessage(`[MAFIA AI] ${context}: ${message}`, 'View Details').then(selection => {
                    if (selection === 'View Details') {
                        this.showOperationLog(operation.operationId);
                    }
                });
            }
        }
        else {
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
    static log(message, context = '', operationId) {
        this.initialize();
        const fullMessage = `[${new Date().toISOString()}] ${context}: ${message}`;
        if (operationId) {
            const opLog = this.operationLogs.get(operationId) || [];
            opLog.push(fullMessage);
            this.operationLogs.set(operationId, opLog);
        }
        this.outputChannel.appendLine(fullMessage);
    }
    static showOperationLog(operationId) {
        const logs = this.operationLogs.get(operationId) || [];
        const panel = vscode.window.createWebviewPanel('operationLog', `Operation ${operationId} Log`, vscode.ViewColumn.Two, {});
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
exports.ErrorHandler = ErrorHandler;
ErrorHandler.operationLogs = new Map();
//# sourceMappingURL=ErrorHandler.js.map