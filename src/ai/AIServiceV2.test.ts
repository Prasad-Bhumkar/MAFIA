import * as vscode from 'vscode';
import { AIServiceV2, AIRequest, Language } from './AIServiceV2';
import { jest } from '@jest/globals';

// Custom type definitions for OpenAI responses
interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string | null;
}

interface ChatCompletion {
  id: string;
  model: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
}

interface ChatCompletionChunk {
  id: string;
  model: string;
  choices: Array<{
    delta: Partial<ChatMessage>;
    finish_reason: string | null;
  }>;
}

// Create mock implementation with proper typing
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
        .mockName('createCompletion')
        .mockImplementation(() => Promise.resolve({} as ChatCompletion))
    }
  }
};

// Type the mock to match the expected interface
type OpenAIMock = {
  chat: {
    completions: {
      create: jest.Mock<Promise<ChatCompletion>|AsyncIterable<ChatCompletionChunk>>;
    };
  };
};

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAI as OpenAIMock)
}));

describe('AIServiceV2', () => {
  let mockContext: vscode.ExtensionContext;
  let aiService: AIServiceV2;

  beforeEach(() => {
    mockContext = {
      secrets: {
        get: jest.fn().mockImplementation(async () => 'test-api-key'),
        store: jest.fn(),
        delete: jest.fn()
      },
      globalState: {
        get: jest.fn(),
        update: jest.fn()
      }
    } as unknown as vscode.ExtensionContext;
    
    aiService = AIServiceV2.getInstance(mockContext);
    jest.clearAllMocks();
  });

  describe('getEnhancedSuggestions', () => {
    it('should handle streaming responses', async () => {
      const mockRequest: AIRequest = {
        context: 'test context',
        language: 'typescript' as Language,
        cursorPosition: new vscode.Position(0, 0),
        document: {
          getText: jest.fn()
        } as unknown as vscode.TextDocument
      };

      async function* mockStreamGenerator() {
        yield {
          id: 'test-stream',
          model: 'gpt-4-turbo',
          choices: [{
            delta: { content: 'streamed ', role: 'assistant' },
            finish_reason: null
          }]
        } as ChatCompletionChunk;
        yield {
          id: 'test-stream',
          model: 'gpt-4-turbo',
          choices: [{
            delta: { content: 'response', role: 'assistant' },
            finish_reason: 'stop'
          }]
        } as ChatCompletionChunk;
      }

      (mockOpenAI.chat.completions.create as jest.Mock).mockImplementation(() => mockStreamGenerator());
      const mockOnStream = jest.fn();

      const result = await aiService.getEnhancedSuggestions(mockRequest, mockOnStream);
      
      expect(mockOnStream).toHaveBeenCalledTimes(2);
      expect(result.suggestions[0]).toBe('streamed response');
    });

    it('should use configuration values', async () => {
      const mockRequest: AIRequest = {
        context: 'test context',
        language: 'typescript' as Language,
        cursorPosition: new vscode.Position(0, 0),
        document: {
          getText: jest.fn()
        } as unknown as vscode.TextDocument
      };

      const mockConfig: vscode.WorkspaceConfiguration = {
        get: (key: string) => {
          switch(key) {
            case 'model': return 'gpt-4-turbo';
            case 'temperature': return 0.7;
            case 'maxTokens': return 1000;
            case 'timeout': return 30000;
            default: return undefined;
          }
        },
        has: () => true,
        inspect: () => undefined,
        update: async () => {}
      };
      jest.spyOn(vscode.workspace, 'getConfiguration').mockReturnValue(mockConfig);

      const mockCompletion: ChatCompletion = {
        id: 'test-id',
        model: 'gpt-4-turbo',
        choices: [{
          message: {
            role: 'assistant',
            content: 'test response'
          },
          finish_reason: 'stop'
        }]
      };

      (mockOpenAI.chat.completions.create as jest.Mock<Promise<ChatCompletion>>).mockResolvedValue(mockCompletion);

      const result = await aiService.getEnhancedSuggestions(mockRequest);
      
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-turbo',
          temperature: 0.7,
          max_tokens: 1000
        }),
        expect.any(Object)
      );
      expect(result.suggestions[0]).toBe('test response');
    });

    it('should handle API errors', async () => {
      const mockRequest: AIRequest = {
        context: 'test context',
        language: 'typescript' as Language,
        cursorPosition: new vscode.Position(0, 0),
        document: {
          getText: jest.fn()
        } as unknown as vscode.TextDocument
      };

      (mockOpenAI.chat.completions.create as jest.Mock).mockRejectedValue(new Error('API error'));

      await expect(aiService.getEnhancedSuggestions(mockRequest))
        .rejects.toThrow('API error');
    });

    it('should track memory usage', async () => {
      const mockRequest: AIRequest = {
        context: 'test context',
        language: 'typescript' as Language,
        cursorPosition: new vscode.Position(0, 0),
        document: {
          getText: jest.fn()
        } as unknown as vscode.TextDocument
      };

      const mockCompletion: ChatCompletion = {
        id: 'test-id',
        model: 'gpt-4-turbo',
        choices: [{
          message: {
            role: 'assistant',
            content: 'test response'
          },
          finish_reason: 'stop'
        }]
      };

      (mockOpenAI.chat.completions.create as jest.Mock<Promise<ChatCompletion>>).mockResolvedValue(mockCompletion);

      await aiService.getEnhancedSuggestions(mockRequest);
      expect(aiService.getMemoryUsage()).toBeGreaterThan(0);
    });
  });
});