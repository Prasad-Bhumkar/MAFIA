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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionProvider = void 0;
const vscode = __importStar(require("vscode"));
class SuggestionProvider {
    constructor(scanner, aiService) {
        this.scanner = scanner;
        this.aiService = aiService;
    }
    provideCompletionItems(document, position, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const context = yield this.scanner.getContextForPosition(document, position);
                const request = {
                    context: context,
                    language: document.languageId === 'typescript' ? 'typescript' : 'java',
                    cursorPosition: position,
                    document: document
                };
                const response = yield this.aiService.getEnhancedSuggestions(request);
                return response.suggestions.map(suggestion => {
                    const item = new vscode.CompletionItem('AI Suggestion', vscode.CompletionItemKind.Snippet);
                    item.documentation = new vscode.MarkdownString(`**AI Generated Suggestion**\n\n${suggestion}` +
                        (response.explanation ? `\n\n**Explanation:** ${response.explanation}` : ''));
                    item.insertText = suggestion;
                    return item;
                });
            }
            catch (error) {
                vscode.window.showErrorMessage(`Suggestion failed: ${error}`);
                return [];
            }
        });
    }
}
exports.SuggestionProvider = SuggestionProvider;
//# sourceMappingURL=SuggestionProvider.js.map