import * as vscode from 'vscode';
import { EnhancedProjectScanner } from '../utils/EnhancedProjectScanner';
import { AIServiceV2, type AIRequest } from './AIServiceV2';

export class SuggestionProvider implements vscode.CompletionItemProvider {
    constructor(
        private scanner: EnhancedProjectScanner,
        private aiService: AIServiceV2
    ) {}

    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<vscode.CompletionItem[]> {
        try {
            const context = await this.scanner.getContextForPosition(document, position);
            const request: AIRequest = {
                context: context,
                language: document.languageId === 'typescript' ? 'typescript' : 'java',
                cursorPosition: position,
                document: document
            };
            const response = await this.aiService.getEnhancedSuggestions(request);
            
            return response.suggestions.map(suggestion => {
                const item = new vscode.CompletionItem('AI Suggestion', vscode.CompletionItemKind.Snippet);
                item.documentation = new vscode.MarkdownString(
                    `**AI Generated Suggestion**\n\n${suggestion}` +
                    (response.explanation ? `\n\n**Explanation:** ${response.explanation}` : '')
                );
                item.insertText = suggestion;
                return item;
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Suggestion failed: ${error}`);
            return [];
        }
    }
}
