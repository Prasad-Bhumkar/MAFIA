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
exports.QualityDashboard = void 0;
const vscode = __importStar(require("vscode"));
const ProjectScanner_1 = require("../utils/ProjectScanner");
class QualityDashboard {
    constructor(context) {
        this.context = context;
    }
    async show(workspaceFolder) {
        const scanner = new ProjectScanner_1.ProjectScanner();
        const structure = await scanner.scanProject(workspaceFolder);
        const panel = vscode.window.createWebviewPanel('qualityDashboard', 'Quality Dashboard', vscode.ViewColumn.One, {});
        panel.webview.html = this.getDashboardHtml(structure);
    }
    getDashboardHtml(structure) {
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
exports.QualityDashboard = QualityDashboard;
//# sourceMappingURL=QualityDashboard.js.map