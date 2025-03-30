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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const openai_1 = __importDefault(require("openai"));
const vscode = __importStar(require("vscode"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
class AIService {
    constructor(context) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.initializeOpenAI(context);
    }
    static getInstance(context) {
        if (!AIService.instance) {
            AIService.instance = new AIService(context);
        }
        return AIService.instance;
    }
    async initializeOpenAI(context) {
        try {
            const apiKey = await this.getApiKey(context);
            if (!apiKey) {
                throw new Error('API key not configured');
            }
            this.openai = new openai_1.default({
                apiKey: apiKey
            });
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'AI Service Initialization');
            throw error;
        }
    }
    async getApiKey(context) {
        const configKey = this.config.get('apiKey');
        if (configKey)
            return configKey;
        try {
            const secretKey = await context.secrets.get('mafiaAI.apiKey');
            if (secretKey)
                return secretKey;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Retrieving API Key');
        }
        return this.promptForApiKey(context);
    }
    async promptForApiKey(context) {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            placeHolder: 'sk-...',
            ignoreFocusOut: true,
            password: true
        });
        if (!apiKey)
            throw new Error('API key required');
        await context.secrets.store('mafiaAI.apiKey', apiKey);
        return apiKey;
    }
    async getSuggestions(context) {
        try {
            const model = this.config.get('model') || 'gpt-3.5-turbo-instruct';
            const temperature = this.config.get('temperature') || 0.7;
            const response = await this.openai.completions.create({
                model,
                prompt: context,
                max_tokens: 100,
                temperature,
                stop: ['\n\n', '//', '/*']
            });
            return response.choices[0]?.text?.trim() || '';
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Getting AI Suggestions');
            throw error;
        }
    }
    async clearApiKey(context) {
        await context.secrets.delete('mafiaAI.apiKey');
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService_temp.js.map