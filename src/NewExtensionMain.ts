import * as vscode from 'vscode';
import { ComponentVisualizer } from './views/ComponentVisualizer';
import { QualityDashboard } from './views/QualityDashboard';
import { EnhancedProjectScanner } from './utils/EnhancedProjectScanner';
import { AIServiceV2 } from './ai/AIServiceV2';
import { SuggestionProvider } from './ai/SuggestionProvider';
import { DependencyMapper } from './analysis/DependencyMapper';
import { ArchitectureValidator } from './analysis/ArchitectureValidator';
import { DocumentationGenerator } from './ai/DocumentationGenerator';
import { DocumentationExporter } from './export/DocumentationExporter';

export default class NewExtensionMain {
    private visualizer: ComponentVisualizer;
    private qualityDashboard: QualityDashboard;
    private projectScanner: EnhancedProjectScanner;
    private aiService: AIServiceV2;
    private docGenerator: DocumentationGenerator;
    private docExporter: DocumentationExporter;
    private suggestionProvider: vscode.Disposable | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.visualizer = new ComponentVisualizer(context);
        this.qualityDashboard = new QualityDashboard(context);
        this.projectScanner = new EnhancedProjectScanner();
        this.aiService = AIServiceV2.getInstance(context);
        this.docGenerator = new DocumentationGenerator(context);
        this.docExporter = new DocumentationExporter();
        this.registerCommands();
    }

    private registerCommands() {
        const dependencyMapper = new DependencyMapper(this.context);
        const architectureValidator = new ArchitectureValidator(this.context);

        this.context.subscriptions.push(
            vscode.commands.registerCommand('mafia.generateDocumentation', 
                () => this.generateDocumentation()),
            // Add other existing commands here
        );
    }

    private async generateDocumentation() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active document found');
            return;
        }
        try {
            await this.docGenerator.exportDocumentation(editor.document, this.docExporter);
        } catch (error) {
            vscode.window.showErrorMessage(`Documentation generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}