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
exports.EnhancedProjectScanner = void 0;
const ProjectScanner_1 = require("./ProjectScanner");
const vscode = __importStar(require("vscode"));
class EnhancedProjectScanner extends ProjectScanner_1.ProjectScanner {
    async getContextForPosition(document, position) {
        const filePath = document.uri.fsPath;
        const classDetails = await this.analyzeClass(filePath);
        const surroundingCode = this.getSurroundingCode(document, position);
        return `
        // Class Context
        Package: ${classDetails.package}
        Class: ${classDetails.className}
        Annotations: ${classDetails.annotations.join(', ')}
        Methods: ${classDetails.methods.map(m => m.name).join(', ')}
        
        // Code Context
        ${surroundingCode}
        `;
    }
    getSurroundingCode(document, position) {
        const range = new vscode.Range(new vscode.Position(Math.max(0, position.line - 5), 0), new vscode.Position(Math.min(position.line + 5, document.lineCount), 0));
        return document.getText(range);
    }
}
exports.EnhancedProjectScanner = EnhancedProjectScanner;
//# sourceMappingURL=EnhancedProjectScanner.js.map