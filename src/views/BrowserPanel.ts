import * as vscode from 'vscode';
import { BrowserService } from '../ai/BrowserService';
import { ErrorHandler } from '../utils/ErrorHandler';

export class BrowserPanel {
    private static instance: BrowserPanel;
    private panel: vscode.WebviewPanel | undefined;
    private browserService: BrowserService;

    private constructor() {
        this.browserService = BrowserService.getInstance();
    }

    public static getInstance(): BrowserPanel {
        if (!BrowserPanel.instance) {
            BrowserPanel.instance = new BrowserPanel();
        }
        return BrowserPanel.instance;
    }

    public async show() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'mafiaBrowser',
            'MAFIA Browser',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        this.panel.webview.onDidReceiveMessage(async message => {
            try {
                switch (message.command) {
                    case 'navigate':
                        const url = await vscode.window.showInputBox({
                            prompt: 'Enter URL to navigate to',
                            placeHolder: 'https://example.com'
                        });
                        if (url) {
                            await this.browserService.navigateTo(url);
                            await this.updateView();
                        }
                        break;
                    case 'refresh':
                        await this.updateView();
                        break;
                    case 'close':
                        await this.browserService.closeBrowser();
                        this.panel?.dispose();
                        break;
                    case 'saveScreenshot':
                        const screenshot = await this.browserService.takeScreenshot();
                        const screenshotUri = await vscode.window.showSaveDialog({
                            filters: { 'PNG Image': ['png'] },
                            defaultUri: vscode.Uri.file('screenshot.png')
                        });
                        if (screenshotUri) {
                            const buffer = Buffer.from(screenshot, 'base64');
                            await vscode.workspace.fs.writeFile(screenshotUri, buffer);
                            vscode.window.showInformationMessage(`Screenshot saved to ${screenshotUri.fsPath}`);
                        }
                        break;
                    case 'exportLogs':
                        const logs = this.browserService.getConsoleLogs();
                        const logsUri = await vscode.window.showSaveDialog({
                            filters: { 'Text Files': ['txt'] },
                            defaultUri: vscode.Uri.file('browser_logs.txt')
                        });
                        if (logsUri) {
                            await vscode.workspace.fs.writeFile(logsUri, Buffer.from(logs));
                            vscode.window.showInformationMessage(`Logs exported to ${logsUri.fsPath}`);
                        }
                        break;
                    case 'clearLogs':
                        this.browserService.clearConsoleLogs();
                        await this.updateView();
                        vscode.window.showInformationMessage('Console logs cleared');
                        break;
                }
            } catch (error) {
                ErrorHandler.handle(error, 'Browser Panel Message');
            }
        });

        // Auto-refresh every 5 seconds
        const refreshInterval = setInterval(async () => {
            if (this.panel) {
                await this.updateView();
            } else {
                clearInterval(refreshInterval);
            }
        }, 5000);

        this.panel.onDidDispose(() => {
            clearInterval(refreshInterval);
        });

        await this.updateView();
    }

    private async updateView() {
        if (!this.panel) return;

        try {
            const screenshot = await this.browserService.takeScreenshot();
            this.panel.webview.html = this.getWebviewContent(screenshot);
        } catch (error) {
            ErrorHandler.handle(error, 'Browser Panel Update');
            this.panel.webview.html = this.getErrorContent(error);
        }
    }

    private getWebviewContent(screenshot: string): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; padding: 0; }
                .controls { padding: 10px; background: #f0f0f0; }
                button { margin-right: 10px; }
                img { max-width: 100%; }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .log-controls {
                    margin-bottom: 10px;
                }
                input, select, .log-controls button {
                    margin-right: 10px;
                    padding: 5px;
                }
                #log-search {
                    width: 200px;
                }
                pre {
                    background: #f5f5f5;
                    padding: 10px;
                    max-height: 500px;
                    overflow: auto;
                }
            </style>
        </head>
        <body>
            <div class="controls">
                <button onclick="navigate()">Navigate</button>
                <button onclick="refresh()">Refresh</button>
                <button onclick="saveScreenshot()">Save Screenshot</button>
                <button onclick="showLogs()">Show Logs</button>
                <button onclick="exportLogs()">Export Logs</button>
                <button onclick="closeBrowser()">Close</button>
            </div>
            <div class="tab-container">
                <div id="screenshot-tab" class="tab-content active">
                    <img src="data:image/png;base64,${screenshot}">
                </div>
                <div id="logs-tab" class="tab-content">
                    <div class="log-controls">
                        <input type="text" id="log-search" placeholder="Search logs..." oninput="searchLogs()">
                        <select id="log-filter" onchange="filterLogs()">
                            <option value="all">All Logs</option>
                            <option value="log">Log</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                            <option value="today">Today</option>
                            <option value="last-hour">Last Hour</option>
                        </select>
                        <button onclick="clearLogs()">Clear Logs</button>
                    </div>
                    <pre id="log-content">${this.browserService.getConsoleLogs()}</pre>
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                function navigate() {
                    vscode.postMessage({ command: 'navigate' });
                }
                function refresh() {
                    vscode.postMessage({ command: 'refresh' });
                }
                function closeBrowser() {
                    vscode.postMessage({ command: 'close' });
                }
                
                function saveScreenshot() {
                    vscode.postMessage({ command: 'saveScreenshot' });
                }

                function showLogs() {
                    document.getElementById('screenshot-tab').classList.remove('active');
                    document.getElementById('logs-tab').classList.add('active');
                }

                function exportLogs() {
                    vscode.postMessage({ command: 'exportLogs' });
                }

                const filterLogs = function() {
                    const filterElement = document.getElementById('log-filter');
                    const logContent = document.getElementById('log-content');
                    if (!filterElement || !logContent) return;
                    
                    const filterValue = (filterElement as HTMLSelectElement).value;
                    const logs = (window as any).browserService.getConsoleLogs();
                    const allLogs = logs.split('\n');
                    const now = new Date();
                    
                    const filteredLogs = allLogs.filter(log => {
                        if (filterValue === 'all') return true;
                        if (['log', 'warning', 'error'].includes(filterValue)) {
                            return log.includes(filterValue.toUpperCase() + ':');
                        }
                        if (filterValue === 'today') {
                            const today = now.toISOString().split('T')[0];
                            return log.includes('[' + today + ']');
                        }
                        if (filterValue === 'last-hour') {
                            const oneHourAgo = new Date(now.getTime() - 3600000);
                            const match = log.match(/\[(.*?)\]/);
                            return match ? new Date(match[1]) > oneHourAgo : false;
                        }
                        return true;
                    });
                    
                    (logContent as HTMLPreElement).textContent = filteredLogs.join('\n');
                };

                function clearLogs() {
                    vscode.postMessage({ command: 'clearLogs' });
                }

                function searchLogs() {
                    const searchTerm = document.getElementById('log-search').value.toLowerCase();
                    const allLogs = \`${this.browserService.getConsoleLogs()}\`.split('\\n');
                    const filteredLogs = allLogs.filter(log => 
                        log.toLowerCase().includes(searchTerm)
                    );
                    document.getElementById('log-content').textContent = filteredLogs.join('\\n');
                }
            </script>
        </body>
        </html>`;
    }

    private getErrorContent(error: unknown): string {
        const message = error instanceof Error ? error.message : String(error);
        return `<!DOCTYPE html>
        <html>
        <body>
            <h1>Browser Error</h1>
            <p>${message}</p>
        </body>
        </html>`;
    }
}