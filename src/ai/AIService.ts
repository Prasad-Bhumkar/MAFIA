/**
 * MAFIA AI Service - Core AI Processing Engine
 * 
 * This service handles all AI-related functionality including:
 * - Query processing and response generation
 * - API key management and security
 * - Response caching and rate limiting
 * - Streaming responses for real-time updates
 * 
 * Key Features:
 * 1. Singleton pattern ensures single instance
 * 2. Secure API key storage using VSCode secrets
 * 3. Intelligent caching with TTL and size limits
 * 4. Configurable rate limiting
 * 5. Support for both streaming and non-streaming responses
 */

import OpenAI from 'openai';
import * as vscode from 'vscode';
// Temporary error handling implementation
const ErrorHandler = {
    handle: (error: unknown, context: string) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[${context}]`, error);
        vscode.window.showErrorMessage(`${context}: ${errorMessage}`);
    }
};
import RateLimiter from '../utils/RateLimiter';

/**
 * Cache entry interface for storing AI responses
 */
interface CacheEntry {
    value: string;      // Cached response content
    timestamp: number;  // Unix timestamp of when cached
}

export class AIService {
    /**
     * Singleton instance of the AI service
     */
    private static instance: AIService;
    
    /**
     * OpenAI client instance
     */
    private openai!: OpenAI;
    
    /**
     * Extension configuration
     */
    private config: vscode.WorkspaceConfiguration;
    
    /**
     * Response cache storage
     */
    private cache: Map<string, CacheEntry>;
    
    /**
     * Maximum number of cache entries
     */
    private maxCacheSize: number;
    
    /**
     * Cache entry time-to-live in seconds
     */
    private cacheTTL: number;
    
    /**
     * Rate limiter instance
     */
    private rateLimiter: RateLimiter;

    /**
     * Private constructor for singleton pattern
     * @param context VSCode extension context
     */
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

    /**
     * Get singleton instance of AI service
     * @param context VSCode extension context
     * @returns AI service instance
     */
    public static getInstance(context: vscode.ExtensionContext): AIService {
        if (!AIService.instance) {
            AIService.instance = new AIService(context);
        }
        return AIService.instance;
    }

    /**
     * Initialize OpenAI client with API key
     * @param context VSCode extension context
     */
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

    /**
     * Retrieve API key from configuration or secret storage
     * @param context VSCode extension context 
     * @returns API key string
     */
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

    /**
     * Prompt user for API key and store it securely
     * @param context VSCode extension context
     * @returns API key string
     */
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

    /**
     * Get AI suggestions for given context
     * 
     * Handles:
     * - Rate limiting
     * - Caching
     * - Streaming responses
     * - Error handling
     * 
     * @param context Input context/prompt
     * @param streamCallback Optional callback for streaming responses
     * @returns Promise resolving to AI response
     */
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

    /**
     * Retrieve value from cache if valid
     * @param key Cache key
     * @returns Cached value or null if expired/missing
     */
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

    /**
     * Add value to cache, evicting oldest entry if needed
     * @param key Cache key
     * @param value Value to cache
     */
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

    /**
     * Clear all cached responses
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * Remove stored API key from secret storage
     * @param context VSCode extension context
     */
    public async clearApiKey(context: vscode.ExtensionContext): Promise<void> {
        await context.secrets.delete('mafiaAI.apiKey');
    }

    /**
     * Process user query (implements IAIService interface)
     * @param query User query string
     * @returns Promise resolving to AI response
     */
    public async processQuery(query: string): Promise<string> {
        return this.getSuggestions(query);
    }
}
