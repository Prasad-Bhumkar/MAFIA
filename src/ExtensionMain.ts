import * as vscode from 'vscode';
import { BlackboxAIMock } from './ai/BlackboxAIMock';
import { ComponentVisualizer } from './views/ComponentVisualizer';
import { QualityDashboard } from './views/QualityDashboard';
import { EnhancedProjectScanner } from './utils/EnhancedProjectScanner';
import { AIServiceV2, AIRequest, Language } from './ai/AIServiceV2';
import { SuggestionProvider } from './ai/SuggestionProvider';
import { DependencyMapper } from './analysis/DependencyMapper';
import { ArchitectureValidator } from './analysis/ArchitectureValidator';
import { DocumentationGenerator } from './ai/DocumentationGenerator';
import { DocumentationExporter } from './export/DocumentationExporter';
import { BrowserCommands } from './commands/BrowserCommands';

export class ExtensionMain {
    private visualizer: ComponentVisualizer;
    private qualityDashboard: QualityDashboard;
    private projectScanner: EnhancedProjectScanner;
    private aiService: AIServiceV2;
    private docGenerator?: DocumentationGenerator;
    private docExporter?: DocumentationExporter;
    private suggestionProvider: vscode.Disposable | undefined;
    private blackboxAI: BlackboxAIMock;

    constructor(private context: vscode.ExtensionContext) {
        this.visualizer = new ComponentVisualizer(context);
        this.qualityDashboard = new QualityDashboard(context);
        this.projectScanner = new EnhancedProjectScanner();
        this.aiService = AIServiceV2.getInstance(context);
        this.blackboxAI = BlackboxAIMock.getInstance();
        // Documentation components will be initialized when needed
        this.registerCommands();
        this.setupStatusBar();
        this.registerAIComponents();
        // Initialize browser commands
        BrowserCommands.getInstance(context);
    }

    private registerCommands() {
        const dependencyMapper = new DependencyMapper(this.context);
        const architectureValidator = new ArchitectureValidator(this.context);

        this.context.subscriptions.push(
            vscode.commands.registerCommand('mafia.showComponentVisualization',
                () => this.showVisualization()),
            vscode.commands.registerCommand('mafia.showQualityDashboard',
                () => this.showQualityDashboard()),
            vscode.commands.registerCommand('mafia.analyzeFile',
                (uri: vscode.Uri) => this.analyzeFile(uri)),
            vscode.commands.registerCommand('mafia.analyzeFolder',
                (uri: vscode.Uri) => this.analyzeFolder(uri)),
            vscode.commands.registerCommand('mafia.aiSuggest',
                () => this.showAISuggestions()),
            vscode.commands.registerCommand('mafia.mapDependencies',
                (uri: vscode.Uri) => dependencyMapper.analyzeDependencies(uri)),
            vscode.commands.registerCommand('mafia.validateArchitecture',
                (uri: vscode.Uri) => architectureValidator.validateArchitecture(uri)),
            vscode.commands.registerCommand('mafia.blackboxai.suggest',
                () => this.handleBlackboxAISuggest()),
            vscode.commands.registerCommand('mafia.blackboxai.analyze',
                (uri: vscode.Uri) => this.handleBlackboxAIAnalyze(uri)),
            vscode.commands.registerCommand('mafia.blackboxai.automate',
                () => this.handleBlackboxAIAutomate())
        );

        vscode.commands.executeCommand('setContext', 'mafia.hasJavaFile', true);
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
        visualizationItem.command = 'mafia.showComponentVisualization';
        visualizationItem.show();

        const dashboardItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 99);
        dashboardItem.text = '$(dashboard) Quality';
        dashboardItem.tooltip = 'Show quality metrics';
        dashboardItem.command = 'mafia.showQualityDashboard';
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
            const request: AIRequest = {
                context: context,
                language: editor.document.languageId === 'typescript' ? 'typescript' : 'java' as Language,
                cursorPosition: editor.selection.active,
                document: editor.document
            };
            const response = await this.aiService.getEnhancedSuggestions(request);
            
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.suggestions[0]);
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

    private async handleBlackboxAISuggest() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const text = editor.document.getText();
        try {
            const suggestions = await this.blackboxAI.getSuggestions(text);
            const quickPick = vscode.window.createQuickPick();
            quickPick.items = suggestions.map(s => ({ label: s }));
            quickPick.onDidChangeSelection(selection => {
                if (selection[0]) {
                    editor.edit(editBuilder => {
                        editBuilder.insert(editor.selection.active, selection[0].label);
                    });
                }
                quickPick.hide();
            });
            quickPick.show();
        } catch (error) {
            this.showError('Failed to get BLACKBOXAI suggestions', error);
        }
    }

    private async handleBlackboxAIAnalyze(uri: vscode.Uri) {
        try {
            const analysis = await this.blackboxAI.analyzeCode(uri.fsPath);
            await this.visualizer.showFileAnalysis(analysis);
            vscode.window.showInformationMessage(`BLACKBOXAI analysis complete for ${uri.fsPath}`);
        } catch (error) {
            this.showError('BLACKBOXAI analysis failed', error);
        }
    }

    private async handleBlackboxAIAutomate() {
        const url = await vscode.window.showInputBox({
            prompt: 'Enter URL for browser automation',
            placeHolder: 'https://example.com'
        });
        if (url) {
            try {
                await this.blackboxAI.automateBrowser(url);
                vscode.window.showInformationMessage(`BLACKBOXAI browser automation started for ${url}`);
            } catch (error) {
                this.showError('BLACKBOXAI browser automation failed', error);
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    new ExtensionMain(context);
    console.log('MAFIA extension is now active!');
}

export function deactivate() {
    console.log('MAFIA extension is now deactivated');
}