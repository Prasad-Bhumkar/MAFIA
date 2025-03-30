import OpenAI from 'openai';
import type { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions';
import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';

export type AIModel = 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-3.5-turbo-instruct' | 'llama3' | 'mistral';
export type Language = 'java' | 'typescript' | 'python' | 'go' | 'rust';

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

interface ArchitectureReview {
    score: number;
    issues: string[];
    recommendations: string[];
    diagram?: string;
}

export class AIServiceV2 {
    private static instance: AIServiceV2;
    private openai!: OpenAI;
    private config: vscode.WorkspaceConfiguration;
    private responseCache: Map<string, AIResponse>;
    private memoryUsage: number;
    private localModelEndpoint: string | undefined;

    private constructor(context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
        this.responseCache = new Map();
        this.memoryUsage = 0;
        this.initializeAI(context);
    }

    public static getInstance(context: vscode.ExtensionContext): AIServiceV2 {
        if (!AIServiceV2.instance) {
            AIServiceV2.instance = new AIServiceV2(context);
        }
        return AIServiceV2.instance;
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

    private async initializeAI(context: vscode.ExtensionContext) {
        try {
            const useLocalModel = this.config.get<boolean>('useLocalModel') || false;
            
            if (useLocalModel) {
                this.localModelEndpoint = this.config.get<string>('localModelEndpoint');
                if (!this.localModelEndpoint) {
                    throw new Error('Local model endpoint not configured');
                }
                return;
            }

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

    public async getEnhancedSuggestions(
        request: AIRequest, 
        onStream?: (chunk: string) => void
    ): Promise<AIResponse> {
        return this.processAIRequest({
            systemPrompt: `You are a ${request.language} expert. Provide concise code suggestions.`,
            request,
            onStream,
            cacheKey: `suggestion:${this.generateCacheKey(request)}`
        });
    }

    public async explainCode(
        request: AIRequest,
        onStream?: (chunk: string) => void
    ): Promise<AIResponse> {
        return this.processAIRequest({
            systemPrompt: `Explain this ${request.language} code in detail:\n\n1. Purpose\n2. Key components\n3. Data flow\n4. Potential issues`,
            request,
            onStream,
            cacheKey: `explanation:${this.generateCacheKey(request)}`
            onStream,
            cacheKey: `explanation:${this.generateCacheKey(request)}`
        });
    }

    public async reviewArchitecture(
        context: string,
        language: Language,
        onProgress?: (message: string) => void
    ): Promise<ArchitectureReview> {
        const cacheKey = `arch-review:${language}:${context.substring(0, 100)}`;
        const cached = this.responseCache.get(cacheKey);
        if (cached) return cached as unknown as ArchitectureReview;

        try {
            onProgress?.('Analyzing architecture...');
            const model = this.config.get<AIModel>('model') || 'gpt-4-turbo';
            
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
            this.responseCache.set(cacheKey, result as unknown as AIResponse);
            return result;
        } catch (error) {
            ErrorHandler.handle(error, 'Architecture Review');
            throw error;
        }
    }

    private async processAIRequest(params: {
        systemPrompt: string;
        request: AIRequest;
        onStream?: (chunk: string) => void;
        cacheKey: string;
    }): Promise<AIResponse> {
        const { systemPrompt, request, onStream, cacheKey } = params;
        const cachedResponse = this.responseCache.get(cacheKey);
        if (cachedResponse && !onStream) return cachedResponse;

        try {
            const model = this.config.get<AIModel>('model') || 'gpt-4-turbo';
            const temperature = this.config.get<number>('temperature') || 0.7;
            const maxTokens = this.config.get<number>('maxTokens') || 1000;

            const messages = [
                { role: 'system' as const, content: systemPrompt },
                { role: 'user' as const, content: request.context }
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

                const result: AIResponse = {
                    suggestions: [fullResponse],
                    explanation: 'AI-generated suggestion',
                    confidence: 0.9
                };
                this.responseCache.set(cacheKey, result);
                return result;
            } else {
                const response = await this.openai.chat.completions.create({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens
                });

                const content = response.choices[0]?.message?.content || '';
                const result: AIResponse = {
                    suggestions: [content],
                    explanation: 'AI-generated suggestion',
                    confidence: 0.9
                };
                this.responseCache.set(cacheKey, result);
                return result;
            }
        } catch (error) {
            ErrorHandler.handle(error, 'AI Processing');
            throw error;
        }
    }

    private parseArchitectureReview(content: string): ArchitectureReview {
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

    private generateMermaidDiagram(content: string): string {
        // Extract components and relationships from AI response
        const components = content.match(/Component: (\w+)/g) || [];
        const relations = content.match(/->|depends on/g) || [];
        
        return `graph TD\n${
            components.map(c => `    ${c}\n`).join('')
        }${
            relations.map(r => `    ${r}\n`).join('')
        }`;
    }

    // ... (keep existing helper methods)
}