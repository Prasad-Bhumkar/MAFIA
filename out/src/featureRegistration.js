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
exports.registerFeatures = registerFeatures;
const vscode = __importStar(require("vscode"));
const AIServiceV2_1 = require("./ai/AIServiceV2");
const TestGenerator_1 = require("./ai/TestGenerator");
const ErrorHandler_1 = require("./utils/ErrorHandler");
function registerFeatures(context) {
    const aiService = AIServiceV2_1.AIServiceV2.getInstance(context);
    registerTestGeneration(context, aiService);
}
function registerTestGeneration(context, aiService) {
    const testGenerator = new TestGenerator_1.TestGenerator(aiService);
    // Register command
    const command = vscode.commands.registerCommand('mafia.generateTests', async (uri) => {
        try {
            await testGenerator.generateTestsForFile(uri);
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Test Generation');
        }
    });
    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 90);
    statusBarItem.text = '$(beaker) Tests';
    statusBarItem.tooltip = 'Generate unit tests for current file';
    statusBarItem.command = 'mafia.generateTests';
    statusBarItem.show();
    context.subscriptions.push(command, statusBarItem);
}
//# sourceMappingURL=featureRegistration.js.map