import React, { useState, ChangeEvent } from 'react';
import * as vscode from 'vscode';
import { AIServiceV2 } from '../ai/AIServiceV2';
import { Logger } from '../utils/Logger';
import { DatabaseService } from '../utils/DatabaseService';

interface AIAssistantViewProps {
  extensionContext: vscode.ExtensionContext;
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ extensionContext }) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ratedSuggestions, setRatedSuggestions] = useState<Record<number, boolean>>({});

  const rateSuggestion = async (index: number, isGood: boolean) => {
    try {
      const dbService = await DatabaseService.getInstance();
      await dbService.logAction(
        'AI_SUGGESTION_RATING', 
        JSON.stringify({
          suggestion: suggestions[index],
          isGood,
          timestamp: new Date()
        })
      );
      setRatedSuggestions(prev => ({...prev, [index]: isGood}));
      vscode.window.showInformationMessage(
        `Suggestion ${isGood ? 'liked' : 'disliked'}!`
      );
    } catch (error) {
      Logger.error('Failed to rate suggestion', error);
      vscode.window.showErrorMessage('Failed to save rating');
    }
  };

  const insertSuggestion = (code: string) => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      editor.edit(editBuilder => {
        editBuilder.insert(editor.selection.active, code);
      });
      vscode.window.showInformationMessage('Code inserted successfully!');
    } else {
      vscode.window.showErrorMessage('No active editor to insert code');
    }
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    try {
      const aiService = AIServiceV2.getInstance(extensionContext);
      const response = await aiService.generateCode(input, 'typescript');
      setSuggestions([response]);
    } catch (error) {
      vscode.window.showErrorMessage(`AI request failed: ${error}`);
      Logger.error('AI Assistant Error', error);
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

        <div className="flex-1 overflow-y-auto space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <pre className="whitespace-pre-wrap flex-1 font-mono text-sm">{suggestion}</pre>
                <div className="flex space-x-2 ml-4">
                  <button 
                    className="p-1 text-green-600 hover:text-green-800"
                    onClick={() => rateSuggestion(index, true)}
                    title="Good suggestion"
                  >
                    <i className="fas fa-thumbs-up"></i>
                  </button>
                  <button 
                    className="p-1 text-red-600 hover:text-red-800"
                    onClick={() => rateSuggestion(index, false)}
                    title="Poor suggestion"
                  >
                    <i className="fas fa-thumbs-down"></i>
                  </button>
                  <button
                    className="p-1 text-blue-600 hover:text-blue-800"
                    onClick={() => insertSuggestion(suggestion)}
                    title="Insert into editor"
                  >
                    <i className="fas fa-code"></i>
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Suggestion #{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAssistantView;