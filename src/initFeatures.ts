import * as vscode from 'vscode';
import { AIServiceV2 } from './ai/AIServiceV2';
import { registerTestCommands } from './commands/testCommands';

export function initializeFeatures(context: vscode.ExtensionContext) {
    const aiService = AIServiceV2.getInstance(context);
    registerTestCommands(context, aiService);
    // Add other feature initializers here
}