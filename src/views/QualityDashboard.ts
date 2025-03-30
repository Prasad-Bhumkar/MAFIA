import * as vscode from 'vscode';
import { ProjectScanner } from '../utils/ProjectScanner';
import { ProjectStructure } from '../utils/FileDetectorTypes';

export class QualityDashboard {
    constructor(private context: vscode.ExtensionContext) {}

    public async show(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
        const scanner = new ProjectScanner();
        const structure = await scanner.scanProject(workspaceFolder);
        
        const panel = vscode.window.createWebviewPanel(
            'qualityDashboard',
            'Quality Dashboard', 
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getDashboardHtml(structure);
    }

    private getDashboardHtml(structure: ProjectStructure): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>Quality Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .metric { margin-bottom: 15px; }
                .metric-title { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Project Quality Metrics</h1>
            <div class="metric">
                <div class="metric-title">Components Found:</div>
                <div>Controllers: ${structure.controllers.length}</div>
                <div>Services: ${structure.services.length}</div>
                <div>Repositories: ${structure.repositories.length}</div>
            </div>
        </body>
        </html>`;
    }
}