import * as vscode from 'vscode';
import * as path from 'path';

export class ProjectItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        public readonly filePath?: string
    ) {
        super(label, collapsibleState);

        this.tooltip = filePath ? `${label} - ${filePath}` : label;
        this.description = filePath ? path.basename(filePath) : '';

        // Set icon based on type
        switch(type) {
            case 'controller':
                this.iconPath = new vscode.ThemeIcon('symbol-class');
                break;
            case 'service':
                this.iconPath = new vscode.ThemeIcon('symbol-method');
                break;
            case 'repository':
                this.iconPath = new vscode.ThemeIcon('database');
                break;
            case 'model':
                this.iconPath = new vscode.ThemeIcon('symbol-structure');
                break;
            case 'config':
                this.iconPath = new vscode.ThemeIcon('settings-gear');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('file');
        }

        // Set context value for conditional visibility in package.json
        this.contextValue = type;
    }
}