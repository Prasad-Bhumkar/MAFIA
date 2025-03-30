"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentPanel = void 0;
const vscode = __importStar(require("vscode"));
class AgentPanel {
    constructor(panel) {
        this.disposables = [];
        this.panel = panel;
        this.initializePanel();
    }
    static createOrShow(context) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (AgentPanel.currentPanel) {
            AgentPanel.currentPanel.panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('mafiaAgent', 'MAFIA Agent', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        AgentPanel.currentPanel = new AgentPanel(panel);
    }
    initializePanel() {
        this.panel.webview.html = this.getWebviewContent();
        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    }
    getWebviewContent() {
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
    updateOperation(operation) {
        this.panel.webview.postMessage(operation);
    }
    dispose() {
        AgentPanel.currentPanel = undefined;
        this.panel.dispose();
        this.disposables.forEach(d => d.dispose());
    }
}
exports.AgentPanel = AgentPanel;
//# sourceMappingURL=AgentPanel.js.map