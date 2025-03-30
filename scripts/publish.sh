#!/bin/bash

# Verify we're on main branch
if [ "$(git branch --show-current)" != "main" ]; then
  echo "Error: Must be on main branch to publish"
  exit 1
fi

# Verify clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working directory not clean"
  exit 1
fi

# Bump version and create tag
echo "➡️ Bumping version..."
npm version patch -m "Bump version to %s"

# Run tests and build
echo "🧪 Running tests and build..."
npm test && npm run compile

# Package extension
echo "📦 Packaging extension..."
vsce package

# Publish to marketplace
echo "🚀 Publishing to VS Code Marketplace..."
vsce publish

# Push changes and tags
echo "🔗 Pushing to remote..."
git push && git push --tags

echo "✅ Publish completed successfully!"