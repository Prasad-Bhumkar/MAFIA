/**
 * MAFIA - VSCode Extension Main Entry Point
 * 
 * REPLICATION GUIDE:
 * 
 * 1. CORE ARCHITECTURE:
 * - Extension uses a main entry point (extension.ts) that delegates to ExtensionMain
 * - Services are implemented as singletons (AIServiceV2, BrowserService, etc.)
 * - Commands are registered in ExtensionMain and BrowserCommands
 * 
 * 2. KEY COMPONENTS:
 * - AI Service: Handles all AI operations (AIServiceV2.ts)
 * - Browser Automation: Puppeteer-based browser control (BrowserService.ts)
 * - Documentation: AI-generated docs with export options (DocumentationGenerator.ts)
 * - Visualization: Webview-based component and quality analysis
 * 
 * 3. IMPLEMENTATION NOTES:
 * - All services use dependency injection via constructor
 * - Error handling centralized in ErrorHandler utility
 * - Configuration managed via EnvironmentConfig
 * - Database integration for logging/analytics
 * 
 * 4. REQUIRED DEPENDENCIES:
 * - VSCode API (@types/vscode)
 * - Puppeteer (for browser automation)
 * - Anthropic/OpenAI SDKs (for AI services)
 * - Marked (for documentation rendering)
 * 
 * 5. SETUP STEPS:
 * 1. Create extension manifest (package.json)
 * 2. Implement core services (AI, Browser, Docs)
 * 3. Register commands and webviews
 * 4. Add status bar integration
 * 5. Configure CI/CD for publishing
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Core Service Interfaces
interface IAIService {
    processQuery(query: string): Promise<string>;
}

interface IBrowserService {
    captureScreenshot(): Promise<void>;
}

interface IDocumentationGenerator {
    generateForFile(filePath: string): Promise<void>;
}

/**
 * Extension Activation
 * 
 * Registers all commands and initializes core services:
 * 1. AI Assistant - Main interface for AI interactions
 * 2. Browser Automation - Puppeteer-based browser control
 * 3. Documentation Tools - Auto-generates docs from code
 */
export function activate(context: vscode.ExtensionContext) {
    // Mock implementations - replace with actual service imports
    const aiService: IAIService = {
        processQuery: async (query) => {
            return `Processed query: ${query}`;
        }
    };

    const browserService: IBrowserService = {
        captureScreenshot: async () => {
            vscode.window.showInformationMessage('Screenshot captured');
        }
    };

    const docGenerator: IDocumentationGenerator = {
        generateForFile: async (filePath) => {
            vscode.window.showInformationMessage(`Documentation generated for ${filePath}`);
        }
    };

    // Register command palette entries
    context.subscriptions.push(
        // Main AI Assistant Panel
        vscode.commands.registerCommand('mafia.showAIAssistant', () => {
            createAIAssistantPanel(context, aiService);
        }),

        // Browser Automation Commands
        vscode.commands.registerCommand('mafia.captureScreenshot', () => {
            browserService.captureScreenshot();
        }),

        // Documentation Generation
        vscode.commands.registerCommand('mafia.generateDocs', () => {
            const activeFile = vscode.window.activeTextEditor?.document.fileName;
            if (activeFile) {
                docGenerator.generateForFile(activeFile);
            }
        })
    );

    // Additional initialization...
}

/**
 * Creates the AI Assistant Webview Panel
 * 
 * Key Components:
 * - Webview Panel: Hosts the React application
 * - Message Passing: Handles communication between webview and extension
 * - AI Service Integration: Connects to the core AI processing logic
 */
function createAIAssistantPanel(
    context: vscode.ExtensionContext, 
    aiService: IAIService
) {
    // Create panel with webview capabilities
    const panel = vscode.window.createWebviewPanel(
        'mafiaAIAssistant',
        'MAFIA AI Assistant',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,          // Required for React
            retainContextWhenHidden: true // Maintains state when panel is hidden
        }
    );

    // Get path to compiled React application
    const scriptPath = vscode.Uri.file(
        path.join(context.extensionPath, 'out', 'views', 'AIAssistantView.js')
    );
    const scriptUri = panel.webview.asWebviewUri(scriptPath);

    // Webview HTML template
    const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MAFIA AI Assistant</title>
        <!-- Tailwind CSS for styling -->
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    </head>
    <body class="font-sans">
        <div id="root"></div>
        <script src="${scriptUri}"></script>
    </body>
    </html>`;

    panel.webview.html = html;

    /**
     * Message Handling System
     * 
     * Routes messages between webview and extension:
     * - User queries -> AI Service
     * - Command execution -> Appropriate handler
     * - Status updates -> Webview
     */
    panel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'query':
                    // Process AI query
                    const response = await aiService.processQuery(message.text);
                    panel.webview.postMessage({
                        command: 'response',
                        data: response
                    });
                    break;
                    
                case 'execute':
                    // Handle command execution
                    vscode.commands.executeCommand(message.commandId);
                    break;

                case 'error':
                    // Display error to user
                    vscode.window.showErrorMessage(message.text);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

/**
 * Extension Deactivation
 * 
 * Clean up resources:
 * - Terminate browser instances
 * - Close database connections
 * - Persist any pending state
 */
export function deactivate() {
    // Cleanup logic here
}
