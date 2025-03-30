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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const vscode = __importStar(require("vscode"));
class ErrorHandler {
    static initialize() {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('IndiCab AI Errors');
        }
    }
    static handle(error, context = '') {
        this.initialize();
        let message = 'An error occurred';
        if (error instanceof Error) {
            message = error.message;
        }
        else if (typeof error === 'string') {
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
    static log(message, context = '') {
        this.initialize();
        const fullMessage = `[${new Date().toISOString()}] ${context}: ${message}`;
        this.outputChannel.appendLine(fullMessage);
    }
}
exports.ErrorHandler = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map