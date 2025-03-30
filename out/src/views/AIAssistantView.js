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
const react_1 = __importStar(require("react"));
const vscode = __importStar(require("vscode"));
const AIAssistantView = ({ extensionContext }) => {
    const [input, setInput] = (0, react_1.useState)('');
    const [suggestions, setSuggestions] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const handleSubmit = async () => {
        if (!input.trim())
            return;
        setIsLoading(true);
        try {
            // TODO: Connect to AIServiceV2
            const mockResponse = [`AI suggestion for: ${input}`];
            setSuggestions(mockResponse);
        }
        catch (error) {
            vscode.window.showErrorMessage(`AI request failed: ${error}`);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (react_1.default.createElement("div", { className: "flex flex-col h-full p-4 bg-gray-100" },
        react_1.default.createElement("div", { className: "mb-4" },
            react_1.default.createElement("h1", { className: "text-xl font-bold text-gray-800" }, "AI Coding Assistant")),
        react_1.default.createElement("div", { className: "flex-1 flex flex-col" },
            react_1.default.createElement("div", { className: "mb-4" },
                react_1.default.createElement("textarea", { className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500", placeholder: "Describe your coding request...", value: input, onChange: (e) => setInput(e.target.value), rows: 4 }),
                react_1.default.createElement("button", { className: "mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50", onClick: handleSubmit, disabled: isLoading }, isLoading ? 'Processing...' : 'Get Suggestions')),
            react_1.default.createElement("div", { className: "flex-1 overflow-y-auto" }, suggestions.map((suggestion, index) => (react_1.default.createElement("div", { key: index, className: "p-3 mb-3 bg-white rounded-lg shadow" },
                react_1.default.createElement("pre", { className: "whitespace-pre-wrap" }, suggestion))))))));
};
exports.default = AIAssistantView;
//# sourceMappingURL=AIAssistantView.js.map