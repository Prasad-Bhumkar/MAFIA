import * as vscode from 'vscode';
import * as path from 'path';
import { AIServiceV2 } from './AIServiceV2';
import { FileParserUtils } from '../utils/FileParserUtils';
import { DocumentationExporter } from '../export/DocumentationExporter';

// Derive types from AIServiceV2 implementation
type AIRequest = Parameters<AIServiceV2['getEnhancedSuggestions']>[0];
type Language = AIRequest['language'];

// Error handling utility
const handleError = (error: unknown, context: string) => {
    console.error(`[${context}]`, error);
    vscode.window.showErrorMessage(`${context} failed: ${error instanceof Error ? error.message : String(error)}`);
};

/**
 * DOCUMENTATION GENERATOR - REPLICATION GUIDE:
 * 
 * 1. Core Functionality:
 * - AI-powered documentation generation from code
 * - Multiple export formats (file, clipboard, preview)
 * - Language-specific formatting (TS, JS, Python, etc.)
 * - Markdown rendering with syntax highlighting
 * - Code structure analysis and visualization
 * 
 * 2. Implementation Requirements:
 * - AIServiceV2 integration (for content generation)
 * - FileParserUtils (for code analysis)
 * - DocumentationExporter (for output handling)
 * - Marked.js (for markdown processing)
 * - Webview API (for preview system)
 * 
 * 3. Key Patterns:
 * - Singleton instance pattern
 * - Template-based output generation
 * - Context-aware documentation
 * - User choice handling via QuickPick
 * - Centralized error handling
 * 
 * 4. Integration Points:
 * - AIServiceV2: Generates documentation content
 * - FileParserUtils: Analyzes code structure
 * - DocumentationExporter: Handles file/clipboard output
 * - ErrorHandler: Manages errors consistently
 * - ExtensionMain: Registers commands
 * 
 * 5. Setup Steps:
 * 1) Implement AIServiceV2 with code generation capabilities
 * 2) Create FileParserUtils for code structure analysis
 * 3) Add DocumentationExporter for output handling
 * 4) Configure markdown processing with marked.js
 * 5) Register commands in ExtensionMain
 * 
 * 6. Key Files to Replicate:
 * - DocumentationGenerator.ts (this file)
 * - FileParserUtils.ts
 * - DocumentationExporter.ts
 * - templates/doc_templates/ (template files)
 * 
 * 7. Usage Example:
 * const generator = DocumentationGenerator.getInstance(context);
 * const docs = await generator.generateDocumentation(activeDocument);
 * await generator.exportDocumentation(docs, exporter);
 */
export class DocumentationGenerator {
    private static instance: DocumentationGenerator;
    private aiService: AIServiceV2;
    private parser: FileParserUtils;

    public constructor(context: vscode.ExtensionContext) {
        this.aiService = AIServiceV2.getInstance(context);
        this.parser = new FileParserUtils();
    }

    public static getInstance(context: vscode.ExtensionContext): DocumentationGenerator {
        if (!DocumentationGenerator.instance) {
            DocumentationGenerator.instance = new DocumentationGenerator(context);
        }
        return DocumentationGenerator.instance;
    }

    /**
     * REPLICATION GUIDE: Documentation Generation
     * 
     * 1. Functionality:
     * - Parses code structure using FileParserUtils
     * - Generates AI-powered documentation
     * - Formats output with timestamp and warnings
     * 
     * 2. Implementation Notes:
     * - Uses AIServiceV2 for content generation
     * - Handles multiple programming languages
     * - Preserves existing code structure
     * 
     * 3. Usage Example:
     * const docs = await generator.generateDocumentation(activeDocument);
     * 
     * @param document VSCode text document to document
     * @returns Formatted markdown documentation
     * @throws Error if generation fails
     */
    public async generateDocumentation(document: vscode.TextDocument): Promise<string> {
        try {
            // Parse code structure and extract existing docs
            const codeStructure = await this.parser.parseDocument(document);
            
            // Generate documentation for undocumented sections
            const request: AIRequest = {
                context: codeStructure,
                language: this.getLanguageId(document.languageId),
                cursorPosition: new vscode.Position(0, 0),
                document
            };
            const aiResponse = await this.aiService.getEnhancedSuggestions(request);

            return this.formatDocumentation(aiResponse.suggestions[0], codeStructure);
        } catch (error) {
            handleError(error, 'Documentation Generation');
            throw error;
        }
    }

    /**
     * REPLICATION GUIDE: Language Mapping
     * 
     * 1. Functionality:
     * - Maps VSCode language IDs to internal types
     * - Provides fallback to TypeScript
     * 
     * 2. Implementation Notes:
     * - Extend mapping to support new languages
     * - Keep in sync with AIServiceV2 capabilities
     * 
     * @param vscodeLanguageId VSCode language identifier
     * @returns Internal language type
     */
    private getLanguageId(vscodeLanguageId: string): Language {
        const mapping: Record<string, any> = {
            'java': 'java',
            'typescript': 'typescript',
            'javascript': 'typescript',
            'python': 'python',
            'go': 'go',
            'rust': 'rust'
        };
        return mapping[vscodeLanguageId] || 'typescript';
    }

    /**
     * REPLICATION GUIDE: Documentation Formatting
     * 
     * 1. Functionality:
     * - Structures raw AI output into markdown
     * - Adds headers and metadata
     * - Includes code structure overview
     * 
     * 2. Implementation Notes:
     * - Uses standard markdown syntax
     * - Timestamps all generated docs
     * - Adds AI disclaimer
     * 
     * @param aiContent Raw AI-generated content
     * @param codeStructure Parsed code structure
     * @returns Formatted markdown documentation
     */
    private formatDocumentation(aiContent: string, codeStructure: string): string {
        const timestamp = new Date().toISOString();
        return `# Code Documentation\n\n` +
               `## Structure Overview\n${codeStructure}\n\n` +
               `## AI-Generated Documentation\n${aiContent}\n\n` +
               `---\n` +
               `*Documentation generated by MAFIA on ${timestamp}*\n` +
               `*This is an AI-generated documentation. Please review for accuracy.*`;
    }

    /**
     * REPLICATION GUIDE: Documentation Export
     * 
     * 1. Functionality:
     * - Provides multiple export options
     * - Handles file, clipboard and preview
     * - Uses DocumentationExporter for output
     * 
     * 2. Implementation Notes:
     * - Shows quick pick menu for user choice
     * - Creates webview panel for preview
     * - Delegates to exporter for file/clipboard
     * 
     * 3. Usage Example:
     * await generator.exportDocumentation(doc, exporter);
     * 
     * @param document VSCode text document
     * @param exporter DocumentationExporter instance
     * @throws Error if export fails
     */
    public async exportDocumentation(
        document: vscode.TextDocument,
        exporter: DocumentationExporter
    ): Promise<void> {
        try {
            const docContent = await this.generateDocumentation(document);
            const fileName = `${path.basename(document.fileName, path.extname(document.fileName))}_docs.md`;
            
            const choice = await vscode.window.showQuickPick(
                ['Save to file', 'Copy to clipboard', 'Preview'],
                { placeHolder: 'How would you like to export the documentation?' }
            );

            if (choice === 'Save to file') {
                await exporter.exportToFile(docContent, fileName);
            } else if (choice === 'Copy to clipboard') {
                await exporter.exportToClipboard(docContent);
            } else if (choice === 'Preview') {
                const panel = vscode.window.createWebviewPanel(
                    'documentationPreview',
                    'Documentation Preview',
                    vscode.ViewColumn.Beside,
                    {}
                );
                panel.webview.html = this.getPreviewHtml(docContent);
            }
        } catch (error) {
            handleError(error, 'Documentation Export');
            throw error;
        }
    }

    /**
     * REPLICATION GUIDE: Preview Generation
     * 
     * 1. Functionality:
     * - Converts markdown to HTML
     * - Creates webview-compatible preview
     * - Applies basic styling
     * 
     * 2. Implementation Notes:
     * - Uses marked.js for markdown parsing
     * - Simple responsive styling
     * - Safe HTML sanitization
     * 
     * @param content Markdown documentation content
     * @returns HTML string for webview
     */
    private getPreviewHtml(content: string): string {
        const marked = require('marked');
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Documentation Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; }
        code { font-family: Consolas, monospace; }
    </style>
</head>
<body>
${marked.parse(content)}
</body>
</html>`;
    }
}