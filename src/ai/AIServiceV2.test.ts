import * as vscode from 'vscode';
import { AIServiceV2, AIRequest, Language } from './AIServiceV2';
import { jest } from '@jest/globals';

import type { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions';

interface ChatMessage {
  role: 'assistant' | 'user' | 'system';
  content: string | null;
}

// Factory function for mock completions
function createMockCompletion(content: string): ChatCompletion {
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
  } as unknown as ChatCompletion;
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
  } as ChatCompletionChunk;
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
  } as ChatCompletionChunk;
}

// Create a strongly typed mock
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn()
        .mockName('createCompletion')
    }
  }
};

// Default mock implementation
mockOpenAI.chat.completions.create.mockImplementation(() => 
  Promise.resolve(createMockCompletion('default response')));

import OpenAI from 'openai';

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(() => mockOpenAI),
  OpenAI: {
    Error: class extends Error {}
  }
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
        };
        yield {
          id: 'test-stream',
          model: 'gpt-4-turbo',
          choices: [{
            delta: { content: 'response', role: 'assistant' },
            finish_reason: 'stop'
          }]
        };
      }

      mockOpenAI.chat.completions.create.mockImplementation(() => mockStreamGenerator());
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

      const mockCompletion = {
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

      mockOpenAI.chat.completions.create.mockResolvedValue({
        ...mockCompletion,
        object: 'chat.completion',
        created: Date.now(),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      } as unknown as ChatCompletion);

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

      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API error') as never);

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

      const mockCompletion = {
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

      mockOpenAI.chat.completions.create.mockResolvedValue({
        ...mockCompletion,
        object: 'chat.completion',
        created: Date.now(),
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      } as unknown as ChatCompletion);

      await aiService.getEnhancedSuggestions(mockRequest);
      expect(aiService.getMemoryUsage()).toBeGreaterThan(0);
    });
  });
});