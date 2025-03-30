import * as vscode from 'vscode';

export class BlackboxAIMock {
    private static instance: BlackboxAIMock;

    private constructor() {}

    public static getInstance(): BlackboxAIMock {
        if (!BlackboxAIMock.instance) {
            BlackboxAIMock.instance = new BlackboxAIMock();
        }
        return BlackboxAIMock.instance;
    }

    public async getSuggestions(context: string): Promise<string[]> {
        return [
            "// BLACKBOXAI suggestion 1",
            "// BLACKBOXAI suggestion 2"
        ];
    }

    public async analyzeCode(filePath: string): Promise<any> {
        return {
            complexity: 5,
            dependencies: [],
            suggestions: []
        };
    }

    public async automateBrowser(url: string): Promise<void> {
        vscode.window.showInformationMessage(`Mock browser automation for ${url}`);
    }
}