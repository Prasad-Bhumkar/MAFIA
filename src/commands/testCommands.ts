import * as vscode from 'vscode';
import { AIServiceV2 } from '../ai/AIServiceV2';
import { TestGenerator } from '../ai/TestGenerator';
import { ErrorHandler } from '../utils/ErrorHandler';

export function registerTestCommands(
    context: vscode.ExtensionContext,
    aiService: AIServiceV2
) {
    const testGenerator = new TestGenerator(aiService);
    
    const generateTestsCommand = vscode.commands.registerCommand(
        'mafia.generateTests',
        async (uri: vscode.Uri) => {
            try {
                await testGenerator.generateTestsForFile(uri);
            } catch (error) {
                ErrorHandler.handle(error, 'Test Generation Command');
            }
        }
    );

    const testStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        90
    );
    testStatusBarItem.text = '$(beaker) Generate Tests';
    testStatusBarItem.tooltip = 'Generate unit tests for current file';
    testStatusBarItem.command = 'mafia.generateTests';
    testStatusBarItem.show();

    context.subscriptions.push(
        generateTestsCommand,
        testStatusBarItem
    );
}