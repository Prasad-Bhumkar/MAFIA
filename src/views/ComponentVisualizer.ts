import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectScanner } from '../utils/ProjectScanner';
import { ProjectStructure } from '../utils/FileDetectorTypes';

export class ComponentVisualizer {
    constructor(private context: vscode.ExtensionContext) {}

    public async show(workspaceFolder: vscode.WorkspaceFolder): Promise<void> {
        const scanner = new ProjectScanner();
        const structure = await scanner.scanProject(workspaceFolder);
        
        const panel = vscode.window.createWebviewPanel(
            'componentVisualizer',
            'Component Visualizer',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getVisualizationHtml(structure);
    }

    private getVisualizationHtml(structure: ProjectStructure): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>Component Relationships</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .component { margin-bottom: 10px; padding: 5px; border: 1px solid #ddd; }
            </style>
        </head>
        <body>
            <h1>Component Relationships</h1>
            ${this.generateComponentList(structure)}
        </body>
        </html>`;
    }

    private generateComponentList(structure: ProjectStructure): string {
        return `
            <h2>Controllers (${structure.controllers.length})</h2>
            ${structure.controllers.map(c => `<div class="component">${c.name}</div>`).join('')}
            
            <h2>Services (${structure.services.length})</h2>
            ${structure.services.map(s => `<div class="component">${s.name}</div>`).join('')}
            
            <h2>Repositories (${structure.repositories.length})</h2>
            ${structure.repositories.map(r => `<div class="component">${r.name}</div>`).join('')}
        `;
    }

    public async showFileAnalysis(analysis: FileAnalysisResult): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'fileAnalysis',
            `Analysis: ${path.basename(analysis.filePath)}`,
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getFileAnalysisHtml(analysis);
    }

    public async showFolderAnalysis(analysis: FolderAnalysisResult): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'folderAnalysis',
            `Analysis: ${path.basename(analysis.folderPath)}`,
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = this.getFolderAnalysisHtml(analysis);
    }

    private getFileAnalysisHtml(analysis: FileAnalysisResult): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>File Analysis</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .metric { margin-bottom: 10px; }
                .dependency { color: #0066cc; }
            </style>
        </head>
        <body>
            <h1>${path.basename(analysis.filePath)}</h1>
            <div class="metric"><strong>Methods:</strong> ${analysis.metrics.complexity}</div>
            <div class="metric"><strong>Annotations:</strong> ${analysis.metrics.annotations}</div>
            <h2>Dependencies</h2>
            ${analysis.relationships.map(d => 
                `<div class="dependency">${d.field}: ${d.type}</div>`).join('')}
        </body>
        </html>`;
    }

    private getFolderAnalysisHtml(analysis: FolderAnalysisResult): string {
        return `<!DOCTYPE html>
        <html>
        <head>
            <title>Folder Analysis</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .summary-item { margin-bottom: 10px; }
            </style>
        </head>
        <body>
            <h1>${path.basename(analysis.folderPath)}</h1>
            <div class="summary-item"><strong>Files:</strong> ${analysis.summary.totalFiles}</div>
            <div class="summary-item"><strong>Methods:</strong> ${analysis.summary.totalMethods}</div>
            <div class="summary-item"><strong>Dependencies:</strong> ${analysis.summary.totalDependencies}</div>
        </body>
        </html>`;
    }
}

interface FileAnalysisResult {
    filePath: string;
    components: any[];
    relationships: Array<{field: string, type: string}>;
    metrics: {
        complexity: number;
        annotations: number;
    };
}

interface FolderAnalysisResult {
    folderPath: string;
    files: string[];
    summary: {
        totalFiles: number;
        totalMethods: number;
        totalDependencies: number;
    };
}
