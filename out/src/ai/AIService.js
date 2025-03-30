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
const RateLimiter_1 = __importDefault(require("../utils/RateLimiter"));
class AIService {
    constructor(context) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.cache = new Map();
        this.maxCacheSize = this.config.get('cacheSize') || 100;
        this.cacheTTL = this.config.get('cacheTTL') || 3600; // 1 hour default
        this.rateLimiter = new RateLimiter_1.default(this.config.get('rateLimit') || 60, // Default: 60 requests
        this.config.get('rateLimitWindow') || 60000 // Default: 1 minute window
        );
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
    async getSuggestions(context, streamCallback) {
        try {
            // Check rate limit
            if (this.rateLimiter.isRateLimited()) {
                throw new Error('Rate limit exceeded. Please wait before making more requests.');
            }
            // Check cache first
            const cached = this.getFromCache(context);
            if (cached) {
                return cached;
            }
            const model = this.config.get('model') || 'gpt-3.5-turbo';
            const temperature = this.config.get('temperature') || 0.7;
            const response = await this.openai.chat.completions.create({
                model,
                messages: [{ role: 'user', content: context }],
                max_tokens: 100,
                temperature,
                stop: ['\n\n', '//', '/*'],
                stream: Boolean(streamCallback)
            });
            let result = '';
            if (streamCallback) {
                const stream = response;
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    result += content;
                    streamCallback(content);
                }
            }
            else {
                const completion = response;
                result = completion.choices[0]?.message?.content?.trim() || '';
            }
            this.addToCache(context, result);
            return result;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Getting AI Suggestions');
            throw error;
        }
    }
    getFromCache(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        // Check if entry is expired
        const now = Date.now();
        if (now - entry.timestamp > this.cacheTTL * 1000) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }
    addToCache(key, value) {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    clearCache() {
        this.cache.clear();
    }
    async clearApiKey(context) {
        await context.secrets.delete('mafiaAI.apiKey');
    }
}
exports.AIService = AIService;
//# sourceMappingURL=AIService.js.map