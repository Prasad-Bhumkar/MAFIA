import * as vscode from 'vscode';
import { EnhancedProjectScanner } from '../utils/EnhancedProjectScanner';
import { AIService } from './AIService';

export class SuggestionProvider implements vscode.CompletionItemProvider {
    constructor(
        private scanner: EnhancedProjectScanner,
        private aiService: AIService
    ) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        try {
            const context = await this.scanner.getContextForPosition(document, position);
            const suggestion = await this.aiService.getSuggestions(context);
            
            const item = new vscode.CompletionItem('AI Suggestion', vscode.CompletionItemKind.Snippet);
            item.documentation = new vscode.MarkdownString(`**AI Generated Suggestion**\n\n${suggestion}`);
            item.insertText = suggestion;
            
            return [item];
        } catch (error) {
            vscode.window.showErrorMessage(`Suggestion failed: ${error}`);
            return [];
        }
    }
}