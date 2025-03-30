import OpenAI from 'openai';
import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';

export class AIService {
    private static instance: AIService;
    private openai!: OpenAI; // Added definite assignment assertion
    private config: vscode.WorkspaceConfiguration;

    private constructor(context: vscode.ExtensionContext) {
        this.config = vscode.workspace.getConfiguration('mafiaAI');
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
            const model = this.config.get<string>('model') || 'gpt-3.5-turbo-instruct';
            const temperature = this.config.get<number>('temperature') || 0.7;

            const response = await this.openai.completions.create({
                model,
                prompt: context,
                max_tokens: 100,
                temperature,
                stop: ['\n\n', '//', '/*']
            });

            return response.choices[0]?.text?.trim() || '';
        } catch (error) {
            ErrorHandler.handle(error, 'Getting AI Suggestions');
            throw error;
        }
    }

    public async clearApiKey(context: vscode.ExtensionContext): Promise<void> {
        await context.secrets.delete('mafiaAI.apiKey');
    }
}