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
exports.ExtensionMain = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const ComponentVisualizer_1 = require("./views/ComponentVisualizer");
const QualityDashboard_1 = require("./views/QualityDashboard");
const EnhancedProjectScanner_1 = require("./utils/EnhancedProjectScanner");
const AIServiceV2_1 = require("./ai/AIServiceV2");
const SuggestionProvider_1 = require("./ai/SuggestionProvider");
const DependencyMapper_1 = require("./analysis/DependencyMapper");
const ArchitectureValidator_1 = require("./analysis/ArchitectureValidator");
class ExtensionMain {
    constructor(context) {
        this.context = context;
        this.visualizer = new ComponentVisualizer_1.ComponentVisualizer(context);
        this.qualityDashboard = new QualityDashboard_1.QualityDashboard(context);
        this.projectScanner = new EnhancedProjectScanner_1.EnhancedProjectScanner();
        this.aiService = AIServiceV2_1.AIServiceV2.getInstance(context);
        // Documentation components will be initialized when needed
        this.registerCommands();
        this.setupStatusBar();
        this.registerAIComponents();
    }
    registerCommands() {
        const dependencyMapper = new DependencyMapper_1.DependencyMapper(this.context);
        const architectureValidator = new ArchitectureValidator_1.ArchitectureValidator(this.context);
        this.context.subscriptions.push(vscode.commands.registerCommand('mafia.showComponentVisualization', () => this.showVisualization()), vscode.commands.registerCommand('mafia.showQualityDashboard', () => this.showQualityDashboard()), vscode.commands.registerCommand('mafia.analyzeFile', (uri) => this.analyzeFile(uri)), vscode.commands.registerCommand('mafia.analyzeFolder', (uri) => this.analyzeFolder(uri)), vscode.commands.registerCommand('mafia.aiSuggest', () => this.showAISuggestions()), vscode.commands.registerCommand('mafia.mapDependencies', (uri) => dependencyMapper.analyzeDependencies(uri)), vscode.commands.registerCommand('mafia.validateArchitecture', (uri) => architectureValidator.validateArchitecture(uri)));
        vscode.commands.executeCommand('setContext', 'mafia.hasJavaFile', true);
    }
    async analyzeFile(uri) {
        try {
            const analysis = await this.projectScanner.analyzeFile(uri.fsPath);
            await this.visualizer.showFileAnalysis(analysis);
            vscode.window.showInformationMessage(`Analysis complete for ${uri.fsPath}`);
        }
        catch (error) {
            this.showError('File analysis failed', error);
        }
    }
    async analyzeFolder(uri) {
        try {
            const analysis = await this.projectScanner.analyzeFolder(uri.fsPath);
            await this.visualizer.showFolderAnalysis(analysis);
            vscode.window.showInformationMessage(`Analysis complete for ${uri.fsPath}`);
        }
        catch (error) {
            this.showError('Folder analysis failed', error);
        }
    }
    setupStatusBar() {
        const visualizationItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        visualizationItem.text = '$(circuit-board) Components';
        visualizationItem.tooltip = 'Show component relationships';
        visualizationItem.command = 'mafia.showComponentVisualization';
        visualizationItem.show();
        const dashboardItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        dashboardItem.text = '$(dashboard) Quality';
        dashboardItem.tooltip = 'Show quality metrics';
        dashboardItem.command = 'mafia.showQualityDashboard';
        dashboardItem.show();
        this.context.subscriptions.push(visualizationItem, dashboardItem);
    }
    async showVisualization() {
        try {
            const workspaceFolder = await this.getWorkspaceFolder();
            if (workspaceFolder) {
                await this.visualizer.show(workspaceFolder);
            }
        }
        catch (error) {
            this.showError('Failed to show visualization', error);
        }
    }
    async showQualityDashboard() {
        try {
            const workspaceFolder = await this.getWorkspaceFolder();
            if (workspaceFolder) {
                await this.qualityDashboard.show(workspaceFolder);
            }
        }
        catch (error) {
            this.showError('Failed to show quality dashboard', error);
        }
    }
    registerAIComponents() {
        const provider = new SuggestionProvider_1.SuggestionProvider(this.projectScanner, this.aiService);
        this.suggestionProvider = vscode.languages.registerCompletionItemProvider('java', provider, '.', '"', "'", ' ', '(');
        this.context.subscriptions.push(this.suggestionProvider);
    }
    async showAISuggestions() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }
        try {
            const context = await this.projectScanner.getContextForPosition(editor.document, editor.selection.active);
            const request = {
                context: context,
                language: editor.document.languageId === 'typescript' ? 'typescript' : 'java',
                cursorPosition: editor.selection.active,
                document: editor.document
            };
            const response = await this.aiService.getEnhancedSuggestions(request);
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.suggestions[0]);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to get suggestions: ${error}`);
        }
    }
    async getWorkspaceFolder() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return undefined;
        }
        return workspaceFolders[0];
    }
    showError(message, error) {
        const fullMessage = `${message}: ${error instanceof Error ? error.message : String(error)}`;
        vscode.window.showErrorMessage(fullMessage);
    }
}
exports.ExtensionMain = ExtensionMain;
function activate(context) {
    new ExtensionMain(context);
    console.log('MAFIA extension is now active!');
}
function deactivate() {
    console.log('MAFIA extension is now deactivated');
}
//# sourceMappingURL=ExtensionMain.js.map