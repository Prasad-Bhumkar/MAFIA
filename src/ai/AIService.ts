import OpenAI from 'openai';
import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';
import RateLimiter from '../utils/RateLimiter';

interface CacheEntry {
    value: string;
    timestamp: number;
}

export class AIService {
    private static instance: AIService;
    private openai!: OpenAI;
    private config: vscode.WorkspaceConfiguration;
    private cache: Map<string, CacheEntry>;
    private maxCacheSize: number;
    private cacheTTL: number;

    private rateLimiter: RateLimiter;

    private constructor(context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.cache = new Map();
        this.maxCacheSize = this.config.get<number>('cacheSize') || 100;
        this.cacheTTL = this.config.get<number>('cacheTTL') || 3600; // 1 hour default
        this.rateLimiter = new RateLimiter(
            this.config.get<number>('rateLimit') || 60, // Default: 60 requests
            this.config.get<number>('rateLimitWindow') || 60_000 // Default: 1 minute window
        );
        this.initializeOpenAI(context);
    }

    public static getInstance(context: vscode.ExtensionContext): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService(context);
        }
        return AIService.instance;
    }

    private async initializeOpenAI(context: vscode.ExtensionContext) {
        try {
            const apiKey = await this.getApiKey(context);
            if (!apiKey) {
                throw new Error('API key not configured');
            }

            this.openai = new OpenAI({
                apiKey: apiKey
            });
        } catch (error) {
            ErrorHandler.handle(error, 'AI Service Initialization');
            throw error;
        }
    }

    private async getApiKey(context: vscode.ExtensionContext): Promise<string> {
        const configKey = this.config.get<string>('apiKey');
        if (configKey) return configKey;

        try {
            const secretKey = await context.secrets.get('mafiaAI.apiKey');
            if (secretKey) return secretKey;
        } catch (error) {
            ErrorHandler.handle(error, 'Retrieving API Key');
        }

        return this.promptForApiKey(context);
    }

    private async promptForApiKey(context: vscode.ExtensionContext): Promise<string> {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            placeHolder: 'sk-...',
            ignoreFocusOut: true,
            password: true
        });

        if (!apiKey) throw new Error('API key required');
        await context.secrets.store('mafiaAI.apiKey', apiKey);
        return apiKey;
    }

    public async getSuggestions(context: string, streamCallback?: (chunk: string) => void): Promise<string> {
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

            const model = this.config.get<string>('model') || 'gpt-3.5-turbo';
            const temperature = this.config.get<number>('temperature') || 0.7;

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
                const stream = response as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    result += content;
                    streamCallback(content);
                }
            } else {
                const completion = response as OpenAI.Chat.Completions.ChatCompletion;
                result = completion.choices[0]?.message?.content?.trim() || '';
            }
            this.addToCache(context, result);
            return result;
        } catch (error) {
            ErrorHandler.handle(error, 'Getting AI Suggestions');
            throw error;
        }
    }

    private getFromCache(key: string): string | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check if entry is expired
        const now = Date.now();
        if (now - entry.timestamp > this.cacheTTL * 1000) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    private addToCache(key: string, value: string): void {
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

    public clearCache(): void {
        this.cache.clear();
    }

    public async clearApiKey(context: vscode.ExtensionContext): Promise<void> {
        await context.secrets.delete('mafiaAI.apiKey');
    }
}
