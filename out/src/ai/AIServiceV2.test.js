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
const AIServiceV2_1 = require("./AIServiceV2");
const globals_1 = require("@jest/globals");
// Factory function for mock completions
function createMockCompletion(content) {
    return {
        id: 'mock-id',
        model: 'gpt-4-turbo',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        choices: [{
                index: 0,
                message: {
                    role: 'assistant',
                    content
                },
                finish_reason: 'stop',
                logprobs: null
            }],
        usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30
        },
        system_fingerprint: 'mock-fingerprint'
    };
}
// Factory function for mock streaming chunks
async function* mockStreamGenerator() {
    yield {
        id: 'test-stream',
        model: 'gpt-4-turbo',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        choices: [{
                index: 0,
                delta: { content: 'streamed ', role: 'assistant' },
                finish_reason: null
            }]
    };
    yield {
        id: 'test-stream',
        model: 'gpt-4-turbo',
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        choices: [{
                index: 0,
                delta: { content: 'response', role: 'assistant' },
                finish_reason: 'stop'
            }]
    };
}
// Create a strongly typed mock
const mockOpenAI = {
    chat: {
        completions: {
            create: globals_1.jest.fn()
                .mockName('createCompletion')
        }
    }
};
// Default mock implementation
mockOpenAI.chat.completions.create.mockImplementation(() => Promise.resolve(createMockCompletion('default response')));
globals_1.jest.mock('openai', () => ({
    __esModule: true,
    default: globals_1.jest.fn(() => mockOpenAI),
    OpenAI: {
        Error: class extends Error {
        }
    }
}));
describe('AIServiceV2', () => {
    let mockContext;
    let aiService;
    beforeEach(() => {
        mockContext = {
            secrets: {
                get: globals_1.jest.fn().mockImplementation(async () => 'test-api-key'),
                store: globals_1.jest.fn(),
                delete: globals_1.jest.fn()
            },
            globalState: {
                get: globals_1.jest.fn(),
                update: globals_1.jest.fn()
            }
        };
        aiService = AIServiceV2_1.AIServiceV2.getInstance(mockContext);
        globals_1.jest.clearAllMocks();
    });
    describe('getEnhancedSuggestions', () => {
        it('should handle streaming responses', async () => {
            const mockRequest = {
                context: 'test context',
                language: 'typescript',
                cursorPosition: new vscode.Position(0, 0),
                document: {
                    getText: globals_1.jest.fn()
                }
            };
            mockOpenAI.chat.completions.create.mockImplementation(() => mockStreamGenerator());
            const mockOnStream = globals_1.jest.fn();
            const result = await aiService.getEnhancedSuggestions(mockRequest, mockOnStream);
            expect(mockOnStream).toHaveBeenCalledTimes(2);
            expect(result.suggestions[0]).toBe('streamed response');
        });
        it('should use configuration values', async () => {
            const mockRequest = {
                context: 'test context',
                language: 'typescript',
                cursorPosition: new vscode.Position(0, 0),
                document: {
                    getText: globals_1.jest.fn()
                }
            };
            const mockConfig = {
                get: (key) => {
                    switch (key) {
                        case 'model': return 'gpt-4-turbo';
                        case 'temperature': return 0.7;
                        case 'maxTokens': return 1000;
                        case 'timeout': return 30000;
                        default: return undefined;
                    }
                },
                has: () => true,
                inspect: () => undefined,
                update: async () => { }
            };
            globals_1.jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig);
            const mockCompletion = createMockCompletion('test response');
            mockOpenAI.chat.completions.create.mockImplementation(async () => mockCompletion);
            const result = await aiService.getEnhancedSuggestions(mockRequest);
            expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(expect.objectContaining({
                model: 'gpt-4-turbo',
                temperature: 0.7,
                max_tokens: 1000
            }), expect.any(Object));
            expect(result.suggestions[0]).toBe('test response');
        });
        it('should handle API errors', async () => {
            const mockRequest = {
                context: 'test context',
                language: 'typescript',
                cursorPosition: new vscode.Position(0, 0),
                document: {
                    getText: globals_1.jest.fn()
                }
            };
            mockOpenAI.chat.completions.create.mockImplementation(async () => {
                throw new Error('API error');
            });
            await expect(aiService.getEnhancedSuggestions(mockRequest))
                .rejects.toThrow('API error');
        });
        it('should track memory usage', async () => {
            const mockRequest = {
                context: 'test context',
                language: 'typescript',
                cursorPosition: new vscode.Position(0, 0),
                document: {
                    getText: globals_1.jest.fn()
                }
            };
            const mockCompletion = createMockCompletion('test response');
            mockOpenAI.chat.completions.create.mockImplementation(async () => mockCompletion);
            await aiService.getEnhancedSuggestions(mockRequest);
            expect(aiService.getMemoryUsage()).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=AIServiceV2.test.js.map