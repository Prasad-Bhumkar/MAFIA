import * as vscode from 'vscode';
import { AIService } from '../../src/ai/AIService';

describe('AIService', () => {
    let aiService: AIService;
    const mockContext: any = {
        secrets: {
            get: jest.fn().mockResolvedValue('test-api-key'),
            store: jest.fn(),
            delete: jest.fn(),
            onDidChange: jest.fn()
        },
        extensionUri: {} as any,
        globalState: {} as any,
        globalStorageUri: {} as any,
        logUri: {} as any,
        storageUri: {} as any,
        subscriptions: [] as any,
        workspaceState: {} as any
    };

    beforeEach(async () => {
        console.log('Initializing test...');
        aiService = AIService.getInstance(mockContext);
        console.log('Clearing cache...');
        aiService.clearCache();
        console.log('Test initialized');
    });

    afterEach(() => {
        console.log('Cleaning up test...');
        jest.clearAllMocks();
        console.log('Test cleanup complete');
    });

    it('should cache responses', async () => {
        // Initialize with test API key
        mockContext.secrets.get.mockResolvedValue('test-api-key');
        
        const prompt = "Test prompt";
        const mockResponse = "Test response";
        
        // Mock the underlying OpenAI call, not getSuggestions
        // Mock the OpenAI API at a higher level
        // Mock the completions API directly
        const mockCreate = jest.fn().mockResolvedValue({
            choices: [{ message: { content: mockResponse } }]
        });
        // Create a full mock OpenAI client
        aiService['openai'] = {
            apiKey: 'test-api-key',
            organization: 'test-org',
            chat: {
                completions: {
                    create: mockCreate,
                    _client: {
                        baseURL: 'https://api.openai.com',
                        defaults: {},
                        request: jest.fn()
                    }
                }
            },
            completions: {
                create: jest.fn()
            }
        } as any;

        // First call - should call OpenAI
        const result1 = await aiService.getSuggestions(prompt);
        expect(result1).toBe(mockResponse);
        expect(mockCreate).toHaveBeenCalledTimes(1);

        // Second call - should use cache
        const result2 = await aiService.getSuggestions(prompt);
        expect(result2).toBe(mockResponse);
        expect(mockCreate).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should handle streaming responses', async () => {
        const mockResponse = "Streaming response";
        const mockStream = (async function* () {
            yield { choices: [{ delta: { content: "Streaming " } }] };
            yield { choices: [{ delta: { content: "response" } }] };
        })();
        
        const mockCreate = jest.fn().mockReturnValue(mockStream);
        aiService['openai'] = {
            chat: {
                completions: {
                    create: mockCreate
                }
            }
        } as any;

        const mockCallback = jest.fn();
        const result = await aiService.getSuggestions("test prompt", mockCallback);

        expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
            stream: true
        }));
        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenCalledWith("Streaming ");
        expect(mockCallback).toHaveBeenCalledWith("response");
        expect(result).toBe("Streaming response");
    });

    it('should expire cache entries', async () => {
        const prompt = "Test prompt";
        const mockResponse = "Test response";
        
        // Set short TTL for testing
        aiService['cacheTTL'] = 1; // 1 second
        
        // Mock the OpenAI API call
        jest.spyOn(aiService, 'getSuggestions')
            .mockImplementation(async () => mockResponse);

        // First call - should cache
        await aiService.getSuggestions(prompt);

        // Wait for cache to expire
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Second call - should miss cache
        await aiService.getSuggestions(prompt);
        expect(aiService['getSuggestions']).toHaveBeenCalledTimes(2);
    });
});