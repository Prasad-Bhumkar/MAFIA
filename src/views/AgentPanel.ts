import * as vscode from 'vscode';
import { ErrorHandler } from '../utils/ErrorHandler';

export class AgentPanel {
    public static currentPanel: AgentPanel | undefined;
    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
        this.panel = panel;
        this.initializePanel();
    }

    public static createOrShow(context: vscode.ExtensionContext) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (AgentPanel.currentPanel) {
            AgentPanel.currentPanel.panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'mafiaAgent',
            'MAFIA Agent',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        AgentPanel.currentPanel = new AgentPanel(panel);
    }

    private initializePanel() {
        this.panel.webview.html = this.getWebviewContent();
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }

    private getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAFIA Agent</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold text-gray-800">MAFIA Agent Operations</h1>
            <div class="flex space-x-2">
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Active</span>
            </div>
        </div>
        
        <div class="space-y-4" id="operationList">
            <!-- Operations will be dynamically added here -->
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const operation = event.data;
            const operationEl = document.createElement('div');
            operationEl.className = 'bg-white p-4 rounded-lg shadow-sm border-l-4';
            operationEl.innerHTML = \`
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-medium text-gray-900">\${operation.type} operation</h3>
                        <p class="text-sm text-gray-600 mt-1">\${operation.description}</p>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium \${{
                        'RUNNING': 'bg-blue-100 text-blue-800',
                        'COMPLETED': 'bg-green-100 text-green-800',
                        'FAILED': 'bg-red-100 text-red-800'
                    }[operation.status]}">
                        \${operation.status}
                    </span>
                </div>
            \`;
            document.getElementById('operationList').prepend(operationEl);
        });
    </script>
</body>
</html>`;
    }

    public updateOperation(operation: {
        id: string;
        type: string;
        status: 'RUNNING' | 'COMPLETED' | 'FAILED';
        description: string;
    }) {
        this.panel.webview.postMessage(operation);
    }

    public dispose() {
        AgentPanel.currentPanel = undefined;
        this.panel.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}