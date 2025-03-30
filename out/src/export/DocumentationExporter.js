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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentationExporter = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const ErrorHandler_1 = require("../utils/ErrorHandler");
class DocumentationExporter {
    async exportToFile(content, defaultFileName) {
        try {
            const uri = await vscode.window.showSaveDialog({
                defaultUri: vscode.Uri.file(path.join(vscode.workspace.rootPath || '', defaultFileName)),
                filters: {
                    'Markdown Files': ['md'],
                    'Text Files': ['txt'],
                    'All Files': ['*']
                },
                saveLabel: 'Export Documentation'
            });
            if (uri) {
                await fs.promises.writeFile(uri.fsPath, content);
                vscode.window.showInformationMessage(`Documentation exported to ${path.basename(uri.fsPath)}`);
                return uri;
            }
            return undefined;
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Documentation Export');
            throw error;
        }
    }
    async exportToClipboard(content) {
        try {
            await vscode.env.clipboard.writeText(content);
            vscode.window.showInformationMessage('Documentation copied to clipboard');
        }
        catch (error) {
            ErrorHandler_1.ErrorHandler.handle(error, 'Clipboard Export');
            throw error;
        }
    }
}
exports.DocumentationExporter = DocumentationExporter;
//# sourceMappingURL=DocumentationExporter.js.map