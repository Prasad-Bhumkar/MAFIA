"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
class ProjectItem extends vscode.TreeItem {
    constructor(label, collapsibleState, type, filePath) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.type = type;
        this.filePath = filePath;
        this.tooltip = filePath ? `${label} - ${filePath}` : label;
        this.description = filePath ? path.basename(filePath) : '';
        // Set icon based on type
        switch (type) {
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
exports.ProjectItem = ProjectItem;
//# sourceMappingURL=ProjectItem.js.map