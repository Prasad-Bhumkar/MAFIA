# MAFIA Project - Terminal Commands Reference

## Development Commands

### Installation
```bash
npm install
```

### Build the project
```bash
npm run build
```

### Run tests
```bash
npm test
```

### Start development server
```bash
npm start
```

## Dependency Management

### Install React dependencies
```bash
npm install react react-dom @types/react @types/react-dom --save-dev
```

### Install VS Code extension dependencies
```bash
npm install @types/vscode --save-dev
```

## Clean & Rebuild

### Clean build artifacts
```bash
rm -rf out/ && mkdir out
```

### Full clean rebuild
```bash
rm -rf out/ node_modules/ && npm install && npm run build
```

## VS Code Extension

### Package extension for deployment
```bash
vsce package
```

### Publish extension
```bash
vsce publish
```

## Debugging

### Run with verbose output
```bash
npm run build -- --verbose
```

### Check for dependency issues
```bash
npm ls
```

## Utility Commands

### Format code
```bash
npm run format
```

### Lint code
```bash
npm run lint
```

### Update all dependencies
```bash
npm update