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
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; }
            </style>
        </head>
        <body class="bg-gray-50 p-6">
            <div class="max-w-4xl mx-auto">
                <h1 class="text-2xl font-bold text-gray-800 mb-6">Project Quality Metrics</h1>
                
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 class="text-lg font-semibold text-gray-700 mb-4">Components Found</h2>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-sm font-medium text-blue-800">Controllers</div>
                            <div class="text-2xl font-bold text-blue-600">${structure.controllers.length}</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-sm font-medium text-green-800">Services</div>
                            <div class="text-2xl font-bold text-green-600">${structure.services.length}</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <div class="text-sm font-medium text-purple-800">Repositories</div>
                            <div class="text-2xl font-bold text-purple-600">${structure.repositories.length}</div>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    }
}