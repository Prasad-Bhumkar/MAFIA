#!/bin/bash

# IndiCab AI Extension Installer

# Check for required dependencies
if ! command -v node &> /dev/null; then
    echo "Node.js is required but not installed. Please install Node.js v16+ first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "npm is required but not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the extension
echo "Building extension..."
npm run compile
npm run package

# Install to VSCode
echo "Installing extension to VSCode..."
code --install-extension mafia.vsix

echo "Installation complete! Please restart VSCode."