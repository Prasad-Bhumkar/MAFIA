import * as React from 'react';
import * as vscode from 'vscode';
import * as path from 'path';
import { DatabaseService } from '../utils/DatabaseService';
import { Logger } from '../utils/Logger';

interface MetricCardProps {
    title: string;
    value: string;
    progress: number;
    color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, progress, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">{value}</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color}`} 
                    style={{ width: `${progress * 100}%` }}
                ></div>
            </div>
        </div>
    </div>
);

export class QualityDashboardController {
    private static instance: QualityDashboardController;
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): QualityDashboardController {
        if (!QualityDashboardController.instance) {
            QualityDashboardController.instance = new QualityDashboardController(context);
        }
        return QualityDashboardController.instance;
    }

    public async show(workspaceFolder: vscode.WorkspaceFolder) {
        try {
            if (this.panel) {
                this.panel.reveal();
                return;
            }

            this.panel = vscode.window.createWebviewPanel(
                'mafiaQualityDashboard',
                'MAFIA Quality Dashboard',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            const scriptPath = vscode.Uri.file(
                path.join(this.context.extensionPath, 'out', 'views', 'QualityDashboard.js')
            );
            const scriptUri = this.panel.webview.asWebviewUri(scriptPath);

            this.panel.webview.html = this.getWebviewContent(scriptUri);
            
            // Handle messages from the webview
            this.panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'refresh':
                            this.refreshMetrics();
                            break;
                    }
                },
                undefined,
                this.context.subscriptions
            );
            this.panel.onDidDispose(() => this.panel = undefined);

            Logger.info('Quality Dashboard opened');
        } catch (error) {
            Logger.error('Failed to show Quality Dashboard', error);
            throw error;
        }
    }

    private async refreshMetrics() {
        try {
            const dbService = await DatabaseService.getInstance();
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || !this.panel) return;

            const rootPath = workspaceFolders[0].uri.fsPath;
            const metrics = {
                testCoverage: 0,
                testPassRate: 0,
                dependencies: 0,
                securityIssues: 0,
                lastUpdated: new Date().toISOString()
            };

            // Get coverage data
            const coverage = await dbService.getCoverage(rootPath);
            metrics.testCoverage = coverage.lineCoverage * 100; // Convert to percentage

            // Get test results
            const testResults = await dbService.getTestResults(rootPath);
            if (testResults.length > 0) {
                metrics.testPassRate = (testResults.filter(t => t.passed).length / testResults.length) * 100;
            }

            // Get dependency count
            const dependencies = await dbService.getDependencies(rootPath);
            metrics.dependencies = dependencies.length;

            // Post updated metrics to webview
            this.panel.webview.postMessage({
                command: 'updateMetrics',
                metrics
            });

            // Log the refresh action
            await dbService.logAction('dashboard_refresh', JSON.stringify({
                coverage: metrics.testCoverage,
                passRate: metrics.testPassRate
            }));
        } catch (error) {
            Logger.error('Failed to refresh metrics', error);
            if (this.panel) {
                this.panel.webview.postMessage({
                    command: 'error',
                    message: 'Failed to load metrics: ' + error.message
                });
            }
        }
    }

    private getWebviewContent(scriptUri: vscode.Uri): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Quality Dashboard</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-50 p-6">
            <div id="root"></div>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}