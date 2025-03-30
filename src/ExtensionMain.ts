import * as vscode from 'vscode';
import { ComponentVisualizer } from './views/ComponentVisualizer';
import { QualityDashboard } from './views/QualityDashboard';
import { EnhancedProjectScanner } from './utils/EnhancedProjectScanner';
import { AIService } from './ai/AIService';
import { SuggestionProvider } from './ai/SuggestionProvider';

export class ExtensionMain {
    private visualizer: ComponentVisualizer;
    private qualityDashboard: QualityDashboard;
    private projectScanner: EnhancedProjectScanner;
    private aiService: AIService;
    private suggestionProvider: vscode.Disposable | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.visualizer = new ComponentVisualizer(context);
        this.qualityDashboard = new QualityDashboard(context);
        this.projectScanner = new EnhancedProjectScanner();
        this.aiService = AIService.getInstance(context);
        this.registerCommands();
        this.setupStatusBar();
        this.registerAIComponents();
    }

    private registerCommands() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('indiCab.showComponentVisualization', 
                () => this.showVisualization()),
            vscode.commands.registerCommand('indiCab.showQualityDashboard',
                () => this.showQualityDashboard()),
            vscode.commands.registerCommand('indiCab.analyzeFile',
                (uri: vscode.Uri) => this.analyzeFile(uri)),
            vscode.commands.registerCommand('indiCab.analyzeFolder',
                (uri: vscode.Uri) => this.analyzeFolder(uri)),
            vscode.commands.registerCommand('indiCab.aiSuggest',
                () => this.showAISuggestions())
        );

        vscode.commands.executeCommand('setContext', 'indiCab.hasJavaFile', true);
    }

    private async analyzeFile(uri: vscode.Uri) {
        try {
            const analysis = await this.projectScanner.analyzeFile(uri.fsPath);
            await this.visualizer.showFileAnalysis(analysis);
            vscode.window.showInformationMessage(`Analysis complete for ${uri.fsPath}`);
        } catch (error) {
            this.showError('File analysis failed', error);
        }
    }

    private async analyzeFolder(uri: vscode.Uri) {
        try {
            const analysis = await this.projectScanner.analyzeFolder(uri.fsPath);
            await this.visualizer.showFolderAnalysis(analysis);
            vscode.window.showInformationMessage(`Analysis complete for ${uri.fsPath}`);
        } catch (error) {
            this.showError('Folder analysis failed', error);
        }
    }

    private setupStatusBar() {
        const visualizationItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 100);
        visualizationItem.text = '$(circuit-board) Components';
        visualizationItem.tooltip = 'Show component relationships';
        visualizationItem.command = 'indiCab.showComponentVisualization';
        visualizationItem.show();

        const dashboardItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 99);
        dashboardItem.text = '$(dashboard) Quality';
        dashboardItem.tooltip = 'Show quality metrics';
        dashboardItem.command = 'indiCab.showQualityDashboard';
        dashboardItem.show();

        this.context.subscriptions.push(visualizationItem, dashboardItem);
    }

    private async showVisualization() {
        try {
            const workspaceFolder = await this.getWorkspaceFolder();
            if (workspaceFolder) {
                await this.visualizer.show(workspaceFolder);
            }
        } catch (error) {
            this.showError('Failed to show visualization', error);
        }
    }

    private async showQualityDashboard() {
        try {
            const workspaceFolder = await this.getWorkspaceFolder();
            if (workspaceFolder) {
                await this.qualityDashboard.show(workspaceFolder);
            }
        } catch (error) {
            this.showError('Failed to show quality dashboard', error);
        }
    }

    private registerAIComponents() {
        const provider = new SuggestionProvider(this.projectScanner, this.aiService);
        this.suggestionProvider = vscode.languages.registerCompletionItemProvider(
            'java',
            provider,
            '.', '"', "'", ' ', '('
        );
        this.context.subscriptions.push(this.suggestionProvider);
    }

    private async showAISuggestions() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        try {
            const context = await this.projectScanner.getContextForPosition(
                editor.document,
                editor.selection.active
            );
            const suggestion = await this.aiService.getSuggestions(context);
            
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, suggestion);
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to get suggestions: ${error}`);
        }
    }

    private async getWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('No workspace folder open');
            return undefined;
        }
        return workspaceFolders[0];
    }

    private showError(message: string, error: unknown) {
        const fullMessage = `${message}: ${error instanceof Error ? error.message : String(error)}`;
        vscode.window.showErrorMessage(fullMessage);
    }
}

export function activate(context: vscode.ExtensionContext) {
    new ExtensionMain(context);
    console.log('IndiCab AI extension is now active!');
}

export function deactivate() {
    console.log('IndiCab AI extension is now deactivated');
}