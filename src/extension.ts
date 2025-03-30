import * as vscode from 'vscode';
import { ExtensionMain } from './ExtensionMain';
import { DocumentationCommand } from './commands/DocumentationCommand';

export function activate(context: vscode.ExtensionContext) {
    // Initialize main extension functionality
    new ExtensionMain(context);
    
    // Register documentation generation command
    const docCommand = new DocumentationCommand(context);
    context.subscriptions.push(docCommand.register());
    
    console.log('MAFIA extension is now active!');
}

export function deactivate() {
    console.log('MAFIA extension is now deactivated');
}