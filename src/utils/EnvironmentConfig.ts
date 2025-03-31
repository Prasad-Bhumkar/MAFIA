import * as vscode from 'vscode';

export class Configuration {
    public static get(key: string): string | undefined {
        const config = vscode.workspace.getConfiguration('mafia');
        return config.get<string>(key);
    }

    public static set(key: string, value: string): Thenable<void> {
        const config = vscode.workspace.getConfiguration('mafia');
        return config.update(key, value, vscode.ConfigurationTarget.Global);
    }

    public static getModelConfig(): { 
        openaiKey: string | undefined,
        anthropicKey: string | undefined,
        localEnabled: boolean 
    } {
        return {
            openaiKey: this.get('OPENAI_API_KEY'),
            anthropicKey: this.get('ANTHROPIC_API_KEY'),
            localEnabled: this.get('LOCAL_AI_ENABLED') === 'true'
        };
    }
}