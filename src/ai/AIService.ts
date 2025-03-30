import OpenAI from 'openai';
import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';

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

    private constructor(context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.cache = new Map();
        this.maxCacheSize = this.config.get<number>('cacheSize') || 100;
        this.cacheTTL = this.config.get<number>('cacheTTL') || 3600; // 1 hour default
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

    public async getSuggestions(context: string): Promise<string> {
        try {
            // Check cache first
            const cached = this.getFromCache(context);
            if (cached) {
                return cached;
            }

            const model = this.config.get<string>('model') || 'gpt-3.5-turbo-instruct';
            const temperature = this.config.get<number>('temperature') || 0.7;

            const response = await this.openai.completions.create({
                model,
                prompt: context,
                max_tokens: 100,
                temperature,
                stop: ['\n\n', '//', '/*']
            });

            const result = response.choices[0]?.text?.trim() || '';
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
