import * as vscode from 'vscode';
import { AIServiceV2 } from './ai/AIServiceV2';
import { TestGenerator } from './ai/TestGenerator';
import { ErrorHandler } from './utils/ErrorHandler';

export function registerFeatures(context: vscode.ExtensionContext): void {
    const aiService = AIServiceV2.getInstance(context);
    registerTestGeneration(context, aiService);
}

function registerTestGeneration(
    context: vscode.ExtensionContext,
    aiService: AIServiceV2
): void {
    const testGenerator = new TestGenerator(aiService);
    
    // Register command
    const command = vscode.commands.registerCommand(
        'mafia.generateTests',
        async (uri: vscode.Uri) => {
            try {
                await testGenerator.generateTestsForFile(uri);
            } catch (error) {
                ErrorHandler.handle(error, 'Test Generation');
            }
        }
    );

    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        90
    );
    statusBarItem.text = '$(beaker) Tests';
    statusBarItem.tooltip = 'Generate unit tests for current file';
    statusBarItem.command = 'mafia.generateTests';
    statusBarItem.show();

    context.subscriptions.push(command, statusBarItem);
}