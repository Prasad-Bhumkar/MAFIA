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
exports.deactivate = exports.activate = exports.ExtensionMain = void 0;
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
        this.registerCommands();
        this.setupStatusBar();
        this.registerAIComponents();
    }
    registerCommands() {
        const dependencyMapper = new DependencyMapper_1.DependencyMapper(this.context);
        const architectureValidator = new ArchitectureValidator_1.ArchitectureValidator(this.context);
        this.context.subscriptions.push(vscode.commands.registerCommand('indiCab.showComponentVisualization', () => this.showVisualization()), vscode.commands.registerCommand('indiCab.showQualityDashboard', () => this.showQualityDashboard()), vscode.commands.registerCommand('indiCab.analyzeFile', (uri) => this.analyzeFile(uri)), vscode.commands.registerCommand('indiCab.analyzeFolder', (uri) => this.analyzeFolder(uri)), vscode.commands.registerCommand('indiCab.aiSuggest', () => this.showAISuggestions()), vscode.commands.registerCommand('indiCab.mapDependencies', (uri) => dependencyMapper.analyzeDependencies(uri)), vscode.commands.registerCommand('indiCab.validateArchitecture', (uri) => architectureValidator.validateArchitecture(uri)));
        vscode.commands.executeCommand('setContext', 'indiCab.hasJavaFile', true);
    }
    analyzeFile(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const analysis = yield this.projectScanner.analyzeFile(uri.fsPath);
                yield this.visualizer.showFileAnalysis(analysis);
                vscode.window.showInformationMessage(`Analysis complete for ${uri.fsPath}`);
            }
            catch (error) {
                this.showError('File analysis failed', error);
            }
        });
    }
    analyzeFolder(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const analysis = yield this.projectScanner.analyzeFolder(uri.fsPath);
                yield this.visualizer.showFolderAnalysis(analysis);
                vscode.window.showInformationMessage(`Analysis complete for ${uri.fsPath}`);
            }
            catch (error) {
                this.showError('Folder analysis failed', error);
            }
        });
    }
    setupStatusBar() {
        const visualizationItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        visualizationItem.text = '$(circuit-board) Components';
        visualizationItem.tooltip = 'Show component relationships';
        visualizationItem.command = 'indiCab.showComponentVisualization';
        visualizationItem.show();
        const dashboardItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        dashboardItem.text = '$(dashboard) Quality';
        dashboardItem.tooltip = 'Show quality metrics';
        dashboardItem.command = 'indiCab.showQualityDashboard';
        dashboardItem.show();
        this.context.subscriptions.push(visualizationItem, dashboardItem);
    }
    showVisualization() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workspaceFolder = yield this.getWorkspaceFolder();
                if (workspaceFolder) {
                    yield this.visualizer.show(workspaceFolder);
                }
            }
            catch (error) {
                this.showError('Failed to show visualization', error);
            }
        });
    }
    showQualityDashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const workspaceFolder = yield this.getWorkspaceFolder();
                if (workspaceFolder) {
                    yield this.qualityDashboard.show(workspaceFolder);
                }
            }
            catch (error) {
                this.showError('Failed to show quality dashboard', error);
            }
        });
    }
    registerAIComponents() {
        const provider = new SuggestionProvider_1.SuggestionProvider(this.projectScanner, this.aiService);
        this.suggestionProvider = vscode.languages.registerCompletionItemProvider('java', provider, '.', '"', "'", ' ', '(');
        this.context.subscriptions.push(this.suggestionProvider);
    }
    showAISuggestions() {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            try {
                const context = yield this.projectScanner.getContextForPosition(editor.document, editor.selection.active);
                const request = {
                    context: context,
                    language: editor.document.languageId === 'typescript' ? 'typescript' : 'java',
                    cursorPosition: editor.selection.active,
                    document: editor.document
                };
                const response = yield this.aiService.getEnhancedSuggestions(request);
                yield editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, response.suggestions[0]);
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to get suggestions: ${error}`);
            }
        });
    }
    getWorkspaceFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders || workspaceFolders.length === 0) {
                vscode.window.showErrorMessage('No workspace folder open');
                return undefined;
            }
            return workspaceFolders[0];
        });
    }
    showError(message, error) {
        const fullMessage = `${message}: ${error instanceof Error ? error.message : String(error)}`;
        vscode.window.showErrorMessage(fullMessage);
    }
}
exports.ExtensionMain = ExtensionMain;
function activate(context) {
    new ExtensionMain(context);
    console.log('IndiCab AI extension is now active!');
}
exports.activate = activate;
function deactivate() {
    console.log('IndiCab AI extension is now deactivated');
}
exports.deactivate = deactivate;
//# sourceMappingURL=ExtensionMain.js.map