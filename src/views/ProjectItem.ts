import * as vscode from 'vscode';
import * as path from 'path';

export class ProjectItem extends vscode.TreeItem {
    iconColor?: vscode.ThemeColor;

    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: string,
        public readonly filePath?: string
    ) {
        super(label, collapsibleState);

        this.tooltip = filePath ? `${label} - ${filePath}` : label;
        this.description = filePath ? path.basename(filePath) : '';

        // Set icon based on type using modern VS Code icons
        switch(type) {
            case 'controller':
                this.iconPath = new vscode.ThemeIcon('server-process');
                break;
            case 'service':
                this.iconPath = new vscode.ThemeIcon('rocket');
                break;
            case 'repository':
                this.iconPath = new vscode.ThemeIcon('database');
                break;
            case 'model':
                this.iconPath = new vscode.ThemeIcon('symbol-class');
                break;
            case 'config':
                this.iconPath = new vscode.ThemeIcon('settings');
                break;
            default:
                this.iconPath = new vscode.ThemeIcon('file-code');
        }

        // Add color coding through theme icon color
        this.iconColor = new vscode.ThemeColor({
            'controller': 'charts.blue',
            'service': 'charts.green', 
            'repository': 'charts.purple',
            'model': 'charts.orange',
            'config': 'charts.yellow'
        }[type] || 'foreground');

        // Set context value for conditional visibility in package.json
        this.contextValue = type;
    }
}