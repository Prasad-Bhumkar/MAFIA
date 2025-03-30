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
const vscode = __importStar(require("vscode"));
const ComponentVisualizer_1 = require("./views/ComponentVisualizer");
const QualityDashboard_1 = require("./views/QualityDashboard");
const EnhancedProjectScanner_1 = require("./utils/EnhancedProjectScanner");
const AIServiceV2_1 = require("./ai/AIServiceV2");
const DependencyMapper_1 = require("./analysis/DependencyMapper");
const ArchitectureValidator_1 = require("./analysis/ArchitectureValidator");
const DocumentationGenerator_1 = require("./ai/DocumentationGenerator");
const DocumentationExporter_1 = require("./export/DocumentationExporter");
class NewExtensionMain {
    constructor(context) {
        this.context = context;
        this.visualizer = new ComponentVisualizer_1.ComponentVisualizer(context);
        this.qualityDashboard = new QualityDashboard_1.QualityDashboard(context);
        this.projectScanner = new EnhancedProjectScanner_1.EnhancedProjectScanner();
        this.aiService = AIServiceV2_1.AIServiceV2.getInstance(context);
        this.docGenerator = new DocumentationGenerator_1.DocumentationGenerator(context);
        this.docExporter = new DocumentationExporter_1.DocumentationExporter();
        this.registerCommands();
    }
    registerCommands() {
        const dependencyMapper = new DependencyMapper_1.DependencyMapper(this.context);
        const architectureValidator = new ArchitectureValidator_1.ArchitectureValidator(this.context);
        this.context.subscriptions.push(vscode.commands.registerCommand('mafia.generateDocumentation', () => this.generateDocumentation()));
    }
    async generateDocumentation() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active document found');
            return;
        }
        try {
            await this.docGenerator.exportDocumentation(editor.document, this.docExporter);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Documentation generation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.default = NewExtensionMain;
//# sourceMappingURL=NewExtensionMain.js.map