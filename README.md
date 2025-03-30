# MAFIA - Modern Architecture Framework & Intelligent Analyzer v1.2.0

[![Version](https://img.shields.io/visual-studio-marketplace/v/mafia)](https://marketplace.visualstudio.com/items?itemName=mafia)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/mafia)](https://marketplace.visualstudio.com/items?itemName=mafia)
[![License](https://img.shields.io/github/license/indicab/vscode-extension)](LICENSE)
[![BLACKBOXAI](https://img.shields.io/badge/integration-BLACKBOXAI-blue)](https://github.com/blackboxai)

![Enhanced Visualization Dashboard](./assets/screenshot.png)

> **New in v1.2.0**: 
> - BLACKBOXAI core integration
> - Enhanced AI suggestions with multi-model support
> - Browser automation via Puppeteer
> - Granular permission system
> - Extended dependency analysis
> - 3x faster visualizations (now with D3.js v7)
> - 75+ quality metrics

## Features ✨

### Next-Gen AI Analysis
- **GPT-4 Turbo** with multi-modal understanding
- Architecture pattern recognition (MVC, Microservices, etc.)
- AI-powered refactoring with safety checks
- Real-time technical debt analysis
- Context-aware suggestions (refactoring, documentation, tests)
- Automated code generation
- **Streaming API** for real-time responses:
  ```typescript
  const result = await aiService.getSuggestions(prompt, (chunk) => {
    // Handle real-time updates
    console.log('Received chunk:', chunk);
  });
  // Full accumulated response
  console.log('Complete response:', result);
  ```

### Advanced Visualization (3x Faster)
- Interactive D3.js diagrams with new layout engine
- Historical trend visualization
- Custom quality thresholds overlay
- Enhanced component relationship mapping
- Click-to-navigate functionality
- Customizable layout options

### Quality Intelligence
- Comprehensive metrics dashboard
- Cyclomatic complexity analysis
- Technical debt scoring
- Historical trend visualization

### Workflow Automation
- Safe AI-assisted refactoring
- Template-based code generation
- Batch processing capabilities
- Incremental project analysis

### Core Capabilities
- Performance optimized scanning
- Secure configuration management
- Cross-project consistency
- Real-time feedback system

## Quick Start 🚀

1. **Install** from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mafia)
2. **Open** a Spring Boot project
3. **Explore** using:
   - Sidebar views (Project Navigator, Quality Dashboard)
   - Status bar quick actions
   - Command Palette (`Ctrl+Shift+P`)

## Documentation 📚

For detailed usage instructions, configuration options, and troubleshooting:

- [Full Documentation](./DOCUMENTATION.md)
- [Configuration Guide](./DOCUMENTATION.md#configuration)
- [Troubleshooting](./DOCUMENTATION.md#troubleshooting)

## Feedback & Support 💬

Found an issue or have a suggestion?
- [Report Issues](https://github.com/example/mafia-extension/issues)
- [Join Discussion](https://github.com/example/mafia-extension/discussions)

## Contributing 🤝

We welcome contributions! Please see our [Contribution Guidelines](CONTRIBUTING.md).
