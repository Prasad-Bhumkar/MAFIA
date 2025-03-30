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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
        this.config = vscode.workspace.getConfiguration('mafiaAI');
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
                const secretKey = yield context.secrets.get('mafiaAI.apiKey');
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
            yield context.secrets.store('mafiaAI.apiKey', apiKey);
            return apiKey;
        });
    }
    getEnhancedSuggestions(request, onStream) {
        var _a, e_1, _b, _c;
        var _d, _e, _f, _g, _h;
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = this.generateCacheKey(request);
            const cachedResponse = this.responseCache.get(cacheKey);
            if (cachedResponse && !onStream) {
                return cachedResponse;
            }
            try {
                const startMemory = process.memoryUsage().heapUsed;
                const model = this.config.get('model') || 'gpt-4-turbo';
                const temperature = this.config.get('temperature') || 0.7;
                const maxTokens = this.config.get('maxTokens') || 1000;
                const timeout = this.config.get('timeout') || 30000;
                const messages = [
                    {
                        role: 'system',
                        content: `You are BLACKBOXAI, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices. Follow these rules:
1. Be direct and technical in responses
2. Focus on clean, modern code
3. Provide complete solutions
4. Use industry best practices
5. For ${request.language} specifically:
   - Follow language idioms
   - Include proper error handling
   - Document complex logic`
                    },
                    {
                        role: 'user',
                        content: request.context
                    }
                ];
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                let fullResponse = '';
                const requestOptions = Object.assign({ model,
                    messages,
                    temperature, max_tokens: maxTokens }, (onStream ? { stream: true } : {}));
                const response = yield this.openai.chat.completions.create(requestOptions, { signal: controller.signal });
                if (onStream && 'pipe' in response) {
                    try {
                        // Handle streaming response
                        for (var _j = true, _k = __asyncValues(response), _l; _l = yield _k.next(), _a = _l.done, !_a;) {
                            _c = _l.value;
                            _j = false;
                            try {
                                const chunk = _c;
                                const content = ((_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content) || '';
                                fullResponse += content;
                                onStream(content);
                            }
                            finally {
                                _j = true;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_j && !_a && (_b = _k.return)) yield _b.call(_k);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    clearTimeout(timeoutId);
                    const result = {
                        suggestions: [fullResponse],
                        explanation: 'AI-generated suggestion',
                        confidence: 0.9
                    };
                    this.responseCache.set(cacheKey, result);
                    return result;
                }
                else {
                    // Handle non-streaming response
                    const completion = response;
                    const endMemory = process.memoryUsage().heapUsed;
                    this.memoryUsage = endMemory - startMemory;
                    const result = {
                        suggestions: [((_h = (_g = (_f = completion.choices[0]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.content) === null || _h === void 0 ? void 0 : _h.trim()) || ''],
                        explanation: 'AI-generated suggestion',
                        confidence: 0.9
                    };
                    this.responseCache.set(cacheKey, result);
                    clearTimeout(timeoutId);
                    return result;
                }
            }
            catch (error) {
                ErrorHandler_1.ErrorHandler.handle(error, 'Getting Enhanced AI Suggestions');
                throw error;
            }
        });
    }
    clearApiKey(context) {
        return __awaiter(this, void 0, void 0, function* () {
            yield context.secrets.delete('mafiaAI.apiKey');
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