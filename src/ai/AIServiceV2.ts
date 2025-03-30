import OpenAI from 'openai';
import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';

export type AIModel = 'gpt-4-turbo' | 'gpt-3.5-turbo-instruct';
export type Language = 'java' | 'typescript';

export interface AIRequest {
    context: string;
    language: Language;
    cursorPosition: vscode.Position;
    document: vscode.TextDocument;
    prompt?: string;
}

interface AIResponse {
    suggestions: string[];
    explanation?: string;
    confidence?: number;
}

export class AIServiceV2 {
    private static instance: AIServiceV2;
    private openai!: OpenAI;
    private config: vscode.WorkspaceConfiguration;
    private responseCache: Map<string, AIResponse>;
    private memoryUsage: number;

    private constructor(context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.responseCache = new Map();
        this.memoryUsage = 0;
        this.initializeOpenAI(context);
    }

    public static getInstance(context: vscode.ExtensionContext): AIServiceV2 {
        if (!AIServiceV2.instance) {
            AIServiceV2.instance = new AIServiceV2(context);
        }
        return AIServiceV2.instance;
    }

    private async initializeOpenAI(context: vscode.ExtensionContext) {
        try {
            const apiKey = await this.getApiKey(context);
            if (!apiKey) {
                throw new Error('API key not configured');
            }

            this.openai = new OpenAI({
                apiKey: apiKey,
                organization: this.config.get('organization') || undefined
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

    public async getEnhancedSuggestions(request: AIRequest): Promise<AIResponse> {
        const cacheKey = this.generateCacheKey(request);
        const cachedResponse = this.responseCache.get(cacheKey);
        if (cachedResponse) {
            return cachedResponse;
        }

        try {
            const startMemory = process.memoryUsage().heapUsed;
            const model = this.config.get<AIModel>('model') || 'gpt-4-turbo';
            const temperature = this.config.get<number>('temperature') || 0.7;

            const messages = [
                {
                    role: 'system' as const,
                    content: `You are a ${request.language} coding assistant. Provide helpful, idiomatic code suggestions.`
                },
                {
                    role: 'user' as const,
                    content: request.context
                }
            ];

            const response = await this.openai.chat.completions.create({
                model,
                messages,
                temperature,
                max_tokens: 500
            });

            const endMemory = process.memoryUsage().heapUsed;
            this.memoryUsage = endMemory - startMemory;

            const result = {
                suggestions: [response.choices[0]?.message?.content?.trim() || ''],
                explanation: 'AI-generated suggestion',
                confidence: 0.9
            };
            this.responseCache.set(cacheKey, result);
            return result;
        } catch (error) {
            ErrorHandler.handle(error, 'Getting Enhanced AI Suggestions');
            throw error;
        }
    }

    public async clearApiKey(context: vscode.ExtensionContext): Promise<void> {
        await context.secrets.delete('mafiaAI.apiKey');
        this.responseCache.clear();
    }

    private generateCacheKey(request: AIRequest): string {
        return `${request.language}:${request.context.substring(0, 100)}:${request.cursorPosition.line}:${request.cursorPosition.character}`;
    }

    public getMemoryUsage(): number {
        return this.memoryUsage;
    }
}