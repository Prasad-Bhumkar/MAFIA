# IndiCab AI Extension Documentation

## Version 2.0 Features

### AI Integration (Phase 1)
- **AIServiceV2**: Enhanced AI service with:
  - Multi-model support (GPT-4 Turbo, GPT-3.5 Turbo)
  - TypeScript and Java language support
  - Context-aware suggestions
- **Suggestion Provider**: 
  - Inline code completions
  - Detailed explanations
  - Confidence scoring

### Advanced Analysis (Phase 2)
- **Dependency Mapper**:
  - Visualizes project structure
  - Identifies component relationships
- **Architecture Validator**:
  - Detects design pattern violations
  - Checks layer separation
  - Identifies circular dependencies

### Optimization (Phase 3)
- **Response Caching**:
  - Reduces API calls
  - Improves performance
- **Memory Tracking**:
  - Monitors heap usage
  - Helps identify memory leaks

## Technical Architecture

```mermaid
graph TD
    A[VS Code Extension] --> B[AI Service]
    A --> C[Project Scanner]
    A --> D[Visualization Engine]
    B --> E[OpenAI API]
    C --> F[AST Parser]
    D --> G[D3.js]
    A --> H[Quality Analyzer]
    H --> I[Metrics Calculator]
```

## Core Features

### AI-Powered Analysis
- **GPT-4 Turbo Integration**: Advanced code understanding and suggestions
- **Context-Aware Prompts**: Project-specific recommendations
- **Multi-Modal Analysis**: Code, documentation and test generation

### Visualization System
- **Interactive Graphs**: Force-directed component diagrams
- **Real-Time Updates**: Live project structure visualization
- **Custom Layouts**: Hierarchical, circular and compact views

### Quality Intelligence
- **Comprehensive Metrics**: 50+ code quality indicators
- **Technical Debt Analysis**: Time/cost estimates for improvements
- **Trend Visualization**: Historical quality tracking

## Installation
```bash
npm install
code --install-extension mafia.vsix
```

## Configuration

### AI Settings
```json
{
  "indicabAI": {
    "apiKey": "your_openai_key",
    "model": "gpt-4-turbo",
    "temperature": 0.7,
    "maxTokens": 2000
  }
}
```

### Quality Thresholds
```json
{
  "indicab.quality": {
    "complexity": 15,
    "cohesion": 0.8, 
    "coupling": 5,
    "security": 0
  }
}
```

### Visualization Settings
```json
{
  "indicab.visualization": {
    "theme": "dark|light|system",
    "layout": "force|hierarchical|circular",
    "animation": true,
    "depth": 3
  }
}
```

## Development Guide

### Building
```bash
npm install
npm run compile
npm run package
```

### Testing
```bash
npm test
```

### Debugging
1. Open extension in VS Code
2. Set breakpoints in source code
3. Press F5 to launch debug session

## Usage
Available commands:
- `indiCab.aiSuggest`: Get AI code suggestions
- `indiCab.mapDependencies`: Analyze project structure
- `indiCab.validateArchitecture`: Check design patterns

## Troubleshooting
- **Memory issues**: Monitor with `getMemoryUsage()`
- **API errors**: Check key permissions and quota

## Support
- [Documentation](https://indicab.dev/docs)
- [Issue Tracker](https://github.com/indicab/vscode-extension/issues)
- [Community Forum](https://github.com/indicab/vscode-extension/discussions)
