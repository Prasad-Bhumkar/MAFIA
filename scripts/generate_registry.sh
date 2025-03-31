#!/bin/bash

# Generate markdown file registry with metadata
REGISTRY_FILE="docs/FILE_REGISTRY.md"
TMP_FILE="/tmp/registry_temp.md"

# Create header
echo "# Markdown File Registry" > $TMP_FILE
echo "Last updated: $(date +%Y-%m-%d)" >> $TMP_FILE
echo "" >> $TMP_FILE

# Find all markdown files and generate table
echo "## Core Documentation" >> $TMP_FILE
echo "| File Path | Last Modified | Priority | Status |" >> $TMP_FILE
echo "|-----------|---------------|----------|--------|" >> $TMP_FILE

find . -name "*.md" | while read -r file; do
    # Skip the registry file itself
    if [[ "$file" == *"FILE_REGISTRY.md"* ]]; then
        continue
    fi
    
    # Get file metadata
    last_modified=$(date -r "$file" +%Y-%m-%d)
    priority="Medium" # Default priority
    status="Active" # Default status
    
    # Check for deprecated content
    if grep -q "\bdeprecated\b" "$file"; then
        status="Deprecated"
    fi
    
    # Check for TODOs to identify needs update
    if grep -q "TODO" "$file"; then
        status="Needs Update"
    fi
    
    # Output table row
    echo "| [$file]($file) | $last_modified | $priority | $status |" >> $TMP_FILE
done

# Move temp file to final location
mv $TMP_FILE $REGISTRY_FILE

echo "Generated markdown registry at $REGISTRY_FILE"