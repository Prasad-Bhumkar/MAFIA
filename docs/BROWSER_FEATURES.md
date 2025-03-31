# MAFIA Browser Features

The MAFIA extension includes powerful browser automation capabilities through Puppeteer integration.

## Available Commands

### `mafia.launchBrowser`
Launches a headless browser instance.

### `mafia.navigateTo [url]`
Navigates the browser to the specified URL.

### `mafia.showBrowserPanel`
Opens an interactive browser control panel with:
- Live preview
- Navigation controls
- Auto-refresh (every 5 seconds)
- Screenshot viewing and saving

### `mafia.closeBrowser`
Closes the browser instance.

## Usage Examples

1. **Basic Navigation**:
```javascript
await vscode.commands.executeCommand('mafia.launchBrowser');
await vscode.commands.executeCommand('mafia.navigateTo', 'https://example.com');
```

2. **Interactive Panel**:
```javascript
await vscode.commands.executeCommand('mafia.showBrowserPanel');
```

## Technical Details

- Uses Puppeteer for browser automation
- Runs in headless mode by default (configurable)
- Maintains browser state between commands
- Includes error handling and recovery

## Configuration Options

Set these in your VS Code settings (settings.json):

```json
"mafiaAI.browserDebug": true, // Show browser window
"mafiaAI.browserTimeout": 30000 // Timeout in ms
```

## Screenshot and Log Export

### Screenshots
Save browser screenshots to your local filesystem:
1. Open the browser panel (`mafia.showBrowserPanel`)
2. Click "Save Screenshot" button
3. Choose location and filename (default: screenshot.png)

### Console Logs
View, search, filter and export browser console logs:
1. Open the browser panel (`mafia.showBrowserPanel`)
2. Click "Show Logs" button
3. Use features:
   - **Search**: Type in search box to filter logs by content
   - **Filter**: Select log type (All/Log/Warning/Error) from dropdown
   - **Clear**: Click "Clear Logs" to reset log history
   - **Export**: Click "Export Logs" to save to file (default: browser_logs.txt)

## Limitations

- Currently supports single browser instance
- Limited to HTTP/HTTPS URLs
- No cookie persistence between sessions
- Screenshots are full-page captures
