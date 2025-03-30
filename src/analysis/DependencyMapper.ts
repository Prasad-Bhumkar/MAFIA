import * as vscode from 'vscode';
import { ProjectScanner } from '../utils/ProjectScanner';
import { AIServiceV2, AIRequest, Language } from '../ai/AIServiceV2';

export class DependencyMapper {
    private scanner: ProjectScanner;
    private aiService: AIServiceV2;

    constructor(context: vscode.ExtensionContext) {
        this.scanner = new ProjectScanner();
        this.aiService = AIServiceV2.getInstance(context);
    }

    public async analyzeDependencies(uri: vscode.Uri): Promise<DependencyMap> {
        const projectStructure = await this.scanner.analyzeFolder(uri.fsPath);
        const request: AIRequest = {
            context: JSON.stringify(projectStructure),
            language: 'java' as Language,
            cursorPosition: new vscode.Position(0, 0),
            document: await vscode.workspace.openTextDocument(uri),
            prompt: 'Analyze and map dependencies for this project structure:'
        };

        const response = await this.aiService.getEnhancedSuggestions(request);

        return this.parseDependencyMap(response.suggestions[0]);
    }

    private parseDependencyMap(aiResponse: string): DependencyMap {
        try {
            return JSON.parse(aiResponse);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to parse dependency map');
            return {};
        }
    }
}

interface DependencyMap {
    [component: string]: {
        dependencies: string[];
        type: 'service' | 'controller' | 'repository' | 'config';
        stability: number;
    };
}