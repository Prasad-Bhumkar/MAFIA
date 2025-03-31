import * as vscode from 'vscode';
import { BrowserService } from '../ai/BrowserService';
import { BrowserPanel } from '../views/BrowserPanel';
import { ErrorHandler } from '../utils/ErrorHandler';

export class BrowserCommands {
    private static instance: BrowserCommands;
    private browserService: BrowserService;

    private constructor(context: vscode.ExtensionContext) {
        this.browserService = BrowserService.getInstance();
        this.registerCommands(context);
    }

    public static getInstance(context: vscode.ExtensionContext): BrowserCommands {
        if (!BrowserCommands.instance) {
            BrowserCommands.instance = new BrowserCommands(context);
        }
        return BrowserCommands.instance;
    }

    private registerCommands(context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('mafia.launchBrowser', async () => {
                try {
                    await this.browserService.launchBrowser();
                    vscode.window.showInformationMessage('Browser launched successfully');
                } catch (error) {
                    ErrorHandler.handle(error, 'Browser Launch');
                }
            }),

            vscode.commands.registerCommand('mafia.navigateTo', async () => {
                const url = await vscode.window.showInputBox({
                    prompt: 'Enter URL to navigate to',
                    placeHolder: 'https://example.com'
                });
                if (!url) return;

                try {
                    await this.browserService.navigateTo(url);
                    vscode.window.showInformationMessage(`Navigated to ${url}`);
                } catch (error) {
                    ErrorHandler.handle(error, 'Browser Navigation');
                }
            }),

            vscode.commands.registerCommand('mafia.showBrowserPanel', async () => {
                try {
                    await BrowserPanel.getInstance().show();
                } catch (error) {
                    ErrorHandler.handle(error, 'Showing Browser Panel');
                }
            }),

            vscode.commands.registerCommand('mafia.closeBrowser', async () => {
                try {
                    await this.browserService.closeBrowser();
                    vscode.window.showInformationMessage('Browser closed successfully');
                } catch (error) {
                    ErrorHandler.handle(error, 'Closing Browser');
                }
            })
        );
    }
}