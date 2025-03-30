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
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 20px;
            margin: 0;
        }
        .operation-list {
            margin-top: 20px;
        }
        .operation-card {
            background: var(--vscode-sideBar-background);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 500;
        }
        .status-running { background: var(--vscode-gitDecoration-addedResourceForeground); }
        .status-completed { background: var(--vscode-gitDecoration-untrackedResourceForeground); }
        .status-failed { background: var(--vscode-gitDecoration-deletedResourceForeground); }
    </style>
</head>
<body>
    <h1>MAFIA Agent Operations</h1>
    <div class="operation-list" id="operationList">
        <!-- Operations will be dynamically added here -->
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const operation = event.data;
            const operationEl = document.createElement('div');
            operationEl.className = 'operation-card';
            operationEl.innerHTML = \`
                <h3>\${operation.type} operation</h3>
                <p>\${operation.description}</p>
                <span class="status-badge status-\${operation.status.toLowerCase()}">
                    \${operation.status}
                </span>
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