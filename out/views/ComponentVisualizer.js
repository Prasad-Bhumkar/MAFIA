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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentVisualizer = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const ProjectScanner_1 = require("../utils/ProjectScanner");
class ComponentVisualizer {
    constructor(context) {
        this.context = context;
    }
    show(workspaceFolder) {
        return __awaiter(this, void 0, void 0, function* () {
            const scanner = new ProjectScanner_1.ProjectScanner();
            const structure = yield scanner.scanProject(workspaceFolder);
            const panel = vscode.window.createWebviewPanel('componentVisualizer', 'Component Visualizer', vscode.ViewColumn.One, {});
            panel.webview.html = this.getVisualizationHtml(structure);
        });
    }
    getVisualizationHtml(structure) {
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
    generateComponentList(structure) {
        return `
            <h2>Controllers (${structure.controllers.length})</h2>
            ${structure.controllers.map(c => `<div class="component">${c.name}</div>`).join('')}
            
            <h2>Services (${structure.services.length})</h2>
            ${structure.services.map(s => `<div class="component">${s.name}</div>`).join('')}
            
            <h2>Repositories (${structure.repositories.length})</h2>
            ${structure.repositories.map(r => `<div class="component">${r.name}</div>`).join('')}
        `;
    }
    showFileAnalysis(analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            const panel = vscode.window.createWebviewPanel('fileAnalysis', `Analysis: ${path.basename(analysis.filePath)}`, vscode.ViewColumn.One, {});
            panel.webview.html = this.getFileAnalysisHtml(analysis);
        });
    }
    showFolderAnalysis(analysis) {
        return __awaiter(this, void 0, void 0, function* () {
            const panel = vscode.window.createWebviewPanel('folderAnalysis', `Analysis: ${path.basename(analysis.folderPath)}`, vscode.ViewColumn.One, {});
            panel.webview.html = this.getFolderAnalysisHtml(analysis);
        });
    }
    getFileAnalysisHtml(analysis) {
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
            ${analysis.relationships.map(d => `<div class="dependency">${d.field}: ${d.type}</div>`).join('')}
        </body>
        </html>`;
    }
    getFolderAnalysisHtml(analysis) {
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
exports.ComponentVisualizer = ComponentVisualizer;
//# sourceMappingURL=ComponentVisualizer.js.map