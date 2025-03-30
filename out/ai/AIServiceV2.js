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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceV2 = void 0;
const openai_1 = __importDefault(require("openai"));
const vscode = __importStar(require("vscode"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
class AIServiceV2 {
    constructor(context) {
        this.config = vscode.workspace.getConfiguration('indicabAI');
        this.responseCache = new Map();
        this.memoryUsage = 0;
        this.initializeOpenAI(context);
    }
    static getInstance(context) {
        if (!AIServiceV2.instance) {
            AIServiceV2.instance = new AIServiceV2(context);
        }
        return AIServiceV2.instance;
    }
    initializeOpenAI(context) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const apiKey = yield this.getApiKey(context);
                if (!apiKey) {
                    throw new Error('API key not configured');
                }
                this.openai = new openai_1.default({
                    apiKey: apiKey,
                    organization: this.config.get('organization') || undefined
                });
            }
            catch (error) {
                ErrorHandler_1.ErrorHandler.handle(error, 'AI Service Initialization');
                throw error;
            }
        });
    }
    getApiKey(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const configKey = this.config.get('apiKey');
            if (configKey)
                return configKey;
            try {
                const secretKey = yield context.secrets.get('indicabAI.apiKey');
                if (secretKey)
                    return secretKey;
            }
            catch (error) {
                ErrorHandler_1.ErrorHandler.handle(error, 'Retrieving API Key');
            }
            return this.promptForApiKey(context);
        });
    }
    promptForApiKey(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const apiKey = yield vscode.window.showInputBox({
                prompt: 'Enter your OpenAI API key',
                placeHolder: 'sk-...',
                ignoreFocusOut: true,
                password: true
            });
            if (!apiKey)
                throw new Error('API key required');
            yield context.secrets.store('indicabAI.apiKey', apiKey);
            return apiKey;
        });
    }
    getEnhancedSuggestions(request) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.generateCacheKey(request);
            const cachedResponse = this.responseCache.get(cacheKey);
            if (cachedResponse) {
                return cachedResponse;
            }
            try {
                const startMemory = process.memoryUsage().heapUsed;
                const model = this.config.get('model') || 'gpt-4-turbo';
                const temperature = this.config.get('temperature') || 0.7;
                const messages = [
                    {
                        role: 'system',
                        content: `You are a ${request.language} coding assistant. Provide helpful, idiomatic code suggestions.`
                    },
                    {
                        role: 'user',
                        content: request.context
                    }
                ];
                const response = yield this.openai.chat.completions.create({
                    model,
                    messages,
                    temperature,
                    max_tokens: 500
                });
                const endMemory = process.memoryUsage().heapUsed;
                this.memoryUsage = endMemory - startMemory;
                const result = {
                    suggestions: [((_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim()) || ''],
                    explanation: 'AI-generated suggestion',
                    confidence: 0.9
                };
                this.responseCache.set(cacheKey, result);
                return result;
            }
            catch (error) {
                ErrorHandler_1.ErrorHandler.handle(error, 'Getting Enhanced AI Suggestions');
                throw error;
            }
        });
    }
    clearApiKey(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.secrets.delete('indicabAI.apiKey');
            this.responseCache.clear();
        });
    }
    generateCacheKey(request) {
        return `${request.language}:${request.context.substring(0, 100)}:${request.cursorPosition.line}:${request.cursorPosition.character}`;
    }
    getMemoryUsage() {
        return this.memoryUsage;
    }
}
exports.AIServiceV2 = AIServiceV2;
//# sourceMappingURL=AIServiceV2.js.map