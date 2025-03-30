import * as vscode from 'vscode';
import * as path from 'path';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('mafia.showAIAssistant', () => {
            createAIAssistantPanel(context);
        })
    );
}

function createAIAssistantPanel(context: vscode.ExtensionContext) {
    // Create and show AI Assistant panel
    const panel = vscode.window.createWebviewPanel(
        'mafiaAIAssistant',
        'MAFIA AI Assistant',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    // Get paths to compiled files
    const scriptPathOnDisk = vscode.Uri.file(
        path.join(context.extensionPath, 'out', 'views', 'AIAssistantView.js')
    );
    const scriptUri = panel.webview.asWebviewUri(scriptPathOnDisk);

    // Set HTML content for the webview
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MAFIA AI Assistant</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
        <div id="root"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;

    panel.webview.html = html;

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'alert':
                    vscode.window.showErrorMessage(message.text);
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

export function deactivate() {}