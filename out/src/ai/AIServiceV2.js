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
exports.AIServiceV2 = void 0;
const openai_1 = __importDefault(require("openai"));
const vscode = __importStar(require("vscode"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
class AIServiceV2 {
    constructor(context) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.responseCache = new Map();
        this.memoryUsage = 0;
        this.initializeAI(context);
    }
    static getInstance(context) {
        if (!AIServiceV2.instance) {
            AIServiceV2.instance = new AIServiceV2(context);
        }
        return AIServiceV2.instance;
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
            throw new ErrorHandler_1.APIKeyError('API key required - please configure in settings');
        await context.secrets.store('mafiaAI.apiKey', apiKey);
        return apiKey;
    }
    async initializeAI(context) {
        try {
            const useLocalModel = this.config.get('useLocalModel') || false;
            if (useLocalModel) {
                this.localModelEndpoint = this.config.get('localModelEndpoint');
                if (!this.localModelEndpoint) {
                    throw new ErrorHandler_1.LocalModelError('Local model endpoint not configured - set mafiaAI.localModelEndpoint in settings');
                }
                return;
            }
            const apiKey = await this.getApiKey(context);
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
    }
    async getEnhancedSuggestions(request, onStream) {
        return this.processAIRequest({
            systemPrompt: `You are a ${request.language} expert. Provide concise code suggestions.`,
            request,
            onStream,
            cacheKey: `suggestion:${this.generateCacheKey(request)}`
        });
    }
    async generateTests(request, onStream) {
        return this.processAIRequest({
            systemPrompt: `Generate unit tests for the following code:\n\n${request.context}`,
            request,
            onStream,
            cacheKey: `test:${this.generateCacheKey(request)}`
        });
    }
    async explainCode(request, onStream) {
        return this.processAIRequest({
            systemPrompt: `Explain this ${request.language} code in detail:\n\n1. Purpose\n2. Key components\n3. Data flow\n4. Potential issues`,
            request,
            onStream,
            cacheKey: `explanation:${this.generateCacheKey(request)}`
        });
    }
    async reviewArchitecture(context, language, onProgress) {
        const cacheKey = `arch-review:${language}:${context.substring(0, 100)}`;
        const cached = this.responseCache.get(cacheKey);
        if (cached)
            return cached;
        try {
            onProgress?.('Analyzing architecture...');
            const model = this.config.get('model') || 'gpt-4-turbo';
            const response = await this.openai.chat.completions.create({
                model,
                messages: [
                    {
                        role: 'system',
                        content: `Review this ${language} system architecture. Evaluate:
1. Modularity
2. Separation of concerns
3. Scalability
4. Common anti-patterns
Provide specific recommendations.`
                    },
                    {
                        role: 'user',
                        content: context
                    }
                ],
                temperature: 0.3 // Lower temp for more factual analysis
            });
            const content = response.choices[0]?.message?.content || '';
            const result = this.parseArchitectureReview(content);
            this.responseCache.set(cacheKey, result);
            return result;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Architecture Review');
            throw error;
        }
    }
    async processAIRequest(params) {
        const { systemPrompt, request, onStream, cacheKey } = params;
        const cachedResponse = this.responseCache.get(cacheKey);
        if (cachedResponse && !onStream)
            return cachedResponse;
        try {
            const model = this.config.get('model') || 'gpt-4-turbo';
            const temperature = this.config.get('temperature') || 0.7;
            const maxTokens = this.config.get('maxTokens') || 1000;
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: request.context }
            ];
            if (this.localModelEndpoint) {
                return this.queryLocalModel({
                    endpoint: this.localModelEndpoint,
                    messages,
                    temperature,
                    maxTokens,
                    onStream
                });
            }
            if (onStream) {
                const stream = await this.openai.chat.completions.create({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream: true
                });
                let fullResponse = '';
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    fullResponse += content;
                    onStream(content);
                }
                const result = {
                    suggestions: [fullResponse],
                    explanation: 'AI-generated suggestion',
                    confidence: 0.9
                };
                this.responseCache.set(cacheKey, result);
                return result;
            }
            else {
                let response;
                try {
                    response = await this.openai.chat.completions.create({
                        model,
                        messages,
                        temperature,
                        max_tokens: maxTokens
                    });
                }
                catch (error) {
                    if (error instanceof Error && error.message.includes('network')) {
                        throw new ErrorHandler_1.NetworkError(`Network error: ${error.message}`);
                    }
                    throw error;
                }
                const content = response.choices[0]?.message?.content || '';
                const result = {
                    suggestions: [content],
                    explanation: 'AI-generated suggestion',
                    confidence: 0.9
                };
                this.responseCache.set(cacheKey, result);
                return result;
            }
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'AI Processing');
            throw error;
        }
    }
    generateCacheKey(request) {
        return `${request.language}:${request.document.fileName}:${request.cursorPosition.line}`;
    }
    async queryLocalModel(params) {
        try {
            const { endpoint, messages, temperature, maxTokens, onStream } = params;
            // Validate endpoint URL
            if (!endpoint.startsWith('http')) {
                throw new ErrorHandler_1.LocalModelError('Invalid local model endpoint. Must start with http/https');
            }
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    messages,
                    temperature,
                    max_tokens: maxTokens,
                    stream: Boolean(onStream)
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new ErrorHandler_1.LocalModelError(`Local model error: ${errorData.error?.message || response.statusText}`);
            }
            if (onStream) {
                // Handle streaming response
                const reader = response.body?.getReader();
                if (!reader)
                    throw new Error('No response body for streaming');
                let fullResponse = '';
                const decoder = new TextDecoder();
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value);
                    fullResponse += chunk;
                    onStream(chunk);
                }
                return {
                    suggestions: [fullResponse],
                    explanation: 'Local model response',
                    confidence: 0.9
                };
            }
            else {
                // Handle non-streaming response
                const data = await response.json();
                return {
                    suggestions: [data.choices?.[0]?.message?.content || ''],
                    explanation: data.choices?.[0]?.message?.role || 'assistant',
                    confidence: 0.9,
                    ...(data.tests && { tests: data.tests })
                };
            }
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Local Model Query');
            return {
                suggestions: ['Error querying local model: ' + error.message],
                explanation: 'Local model error',
                confidence: 0.1
            };
        }
    }
    parseArchitectureReview(content) {
        // Parse the AI response into structured review
        const scoreMatch = content.match(/Score: (\d+)\/10/);
        const issues = content.match(/Issues:\n([\s\S]+?)(?=\nRecommendations:|$)/)?.[1]?.split('\n- ') || [];
        const recommendations = content.match(/Recommendations:\n([\s\S]+)/)?.[1]?.split('\n- ') || [];
        return {
            score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
            issues: issues.filter(i => i.trim()),
            recommendations: recommendations.filter(r => r.trim()),
            diagram: this.generateMermaidDiagram(content)
        };
    }
    generateMermaidDiagram(content) {
        // Extract components and relationships from AI response
        const components = content.match(/Component: (\w+)/g) || [];
        const relations = content.match(/->|depends on/g) || [];
        return `graph TD\n${components.map(c => `    ${c}\n`).join('')}${relations.map(r => `    ${r}\n`).join('')}`;
    }
    getMemoryUsage() {
        return this.memoryUsage;
    }
}
exports.AIServiceV2 = AIServiceV2;
//# sourceMappingURL=AIServiceV2.js.map