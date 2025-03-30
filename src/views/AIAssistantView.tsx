import React, { useState, ChangeEvent } from 'react';
import * as vscode from 'vscode';

interface AIAssistantViewProps {
  extensionContext: vscode.ExtensionContext;
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ extensionContext }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      // TODO: Connect to AIServiceV2
      const mockResponse = [`AI suggestion for: ${input}`];
      setSuggestions(mockResponse);
    } catch (error) {
      vscode.window.showErrorMessage(`AI request failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-100">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">AI Coding Assistant</h1>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your coding request..."
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            rows={4}
          />
          <button
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Get Suggestions'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-3 mb-3 bg-white rounded-lg shadow">
              <pre className="whitespace-pre-wrap">{suggestion}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantView;